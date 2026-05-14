/**
 * Support Ticket Service — Lógica de negocio del sistema HelpDesk.
 *
 * Implementa:
 * - CRUD completo de tickets
 * - Workflow de estados con validación de transiciones
 * - Comentarios técnicos con timeline
 * - Notificaciones por email
 * - Historial de cambios
 * - Métricas para dashboard
 */
import { connectDB } from '@/lib/mongodb';
import SupportTicket from '@/models/SupportTicket';
import Client from '@/models/Client';
import { sendEmail } from '@/lib/email';
import { supportTicketCreatedTemplate, supportTicketUpdatedTemplate } from '@/lib/email-templates';
import type { CreateTicketInput, UpdateTicketStatusInput, AddTicketCommentInput, TicketQueryInput } from '@/core/dtos/support-ticket.dto';

// ─── Transiciones de estado válidas ──────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  RECIBIDO: ['DIAGNOSTICO', 'CANCELADO'],
  DIAGNOSTICO: ['REPARACION', 'ESPERANDO_REPUESTO', 'CANCELADO'],
  REPARACION: ['FINALIZADO', 'ESPERANDO_REPUESTO', 'CANCELADO'],
  ESPERANDO_REPUESTO: ['REPARACION', 'CANCELADO'],
  FINALIZADO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

/**
 * Crear un ticket de soporte.
 */
export async function createTicket(clientId: string, data: CreateTicketInput) {
  await connectDB();

  const client = await Client.findById(clientId);
  if (!client) throw new Error('Cliente no encontrado');

  const ticket = new SupportTicket({
    client: clientId,
    subject: data.subject,
    description: data.description,
    category: data.category,
    priority: data.priority,
    deviceInfo: data.deviceInfo,
    attachments: data.attachments,
    statusHistory: [{
      from: 'NUEVO',
      to: 'RECIBIDO',
      changedBy: clientId,
      changedByName: client.name,
      reason: 'Ticket creado por el cliente',
      timestamp: new Date(),
    }],
  });

  await ticket.save();

  // Notificación por email (no bloquea)
  try {
    const html = supportTicketCreatedTemplate(client.name, ticket.code, data.subject);
    await sendEmail({
      to: client.email,
      subject: `Ticket ${ticket.code} creado — Palacio Gamer`,
      html,
    });
  } catch (err) {
    console.error('Error enviando email de ticket:', err);
  }

  return ticket;
}

/**
 * Obtener tickets con filtros y paginación.
 */
export async function getTickets(query: TicketQueryInput) {
  await connectDB();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { isActive: true };

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = query.category;
  if (query.clientId) filter.client = query.clientId;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;
  if (query.search) {
    filter.$or = [
      { code: { $regex: query.search, $options: 'i' } },
      { subject: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [tickets, total] = await Promise.all([
    SupportTicket.find(filter)
      .populate('client', 'name email phone documentNumber')
      .populate('assignedTo', 'name employeeId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    SupportTicket.countDocuments(filter),
  ]);

  return {
    tickets,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

/**
 * Obtener un ticket por ID con todos los datos.
 */
export async function getTicketById(ticketId: string) {
  await connectDB();

  const ticket = await SupportTicket.findById(ticketId)
    .populate('client', 'name email phone documentNumber address')
    .populate('assignedTo', 'name employeeId email')
    .lean();

  if (!ticket) throw new Error('Ticket no encontrado');

  return ticket;
}

/**
 * Actualizar estado de un ticket con validación de workflow.
 */
export async function updateTicketStatus(
  ticketId: string,
  employeeId: string,
  employeeName: string,
  data: UpdateTicketStatusInput
) {
  await connectDB();

  const ticket = await SupportTicket.findById(ticketId)
    .populate('client', 'name email');

  if (!ticket) throw new Error('Ticket no encontrado');

  // Validar transición
  const allowedTransitions = VALID_TRANSITIONS[ticket.status] || [];
  if (!allowedTransitions.includes(data.status)) {
    throw new Error(
      `Transición inválida: ${ticket.status} → ${data.status}. Permitidas: ${allowedTransitions.join(', ')}`
    );
  }

  const oldStatus = ticket.status;

  // Actualizar campos
  ticket.status = data.status;
  if (data.estimatedCost !== undefined) ticket.estimatedCost = data.estimatedCost;
  if (data.finalCost !== undefined) ticket.finalCost = data.finalCost;
  if (data.estimatedDate) ticket.estimatedDate = new Date(data.estimatedDate);
  if (data.assignedTo) ticket.assignedTo = data.assignedTo as any;
  if (data.status === 'FINALIZADO') ticket.completedDate = new Date();

  // Registrar cambio en historial
  ticket.statusHistory.push({
    from: oldStatus,
    to: data.status,
    changedBy: employeeId as any,
    changedByName: employeeName,
    reason: data.reason,
    timestamp: new Date(),
  });

  await ticket.save();

  // Notificar al cliente por email
  try {
    const client = ticket.client as any;
    if (client?.email) {
      const statusLabels: Record<string, string> = {
        RECIBIDO: '📩 Recibido',
        DIAGNOSTICO: '🔍 En Diagnóstico',
        REPARACION: '🔧 En Reparación',
        ESPERANDO_REPUESTO: '📦 Esperando Repuesto',
        FINALIZADO: '✅ Finalizado',
        ENTREGADO: '📋 Entregado',
        CANCELADO: '❌ Cancelado',
      };
      const html = supportTicketUpdatedTemplate(
        client.name,
        ticket.code,
        statusLabels[data.status] || data.status
      );
      await sendEmail({
        to: client.email,
        subject: `Ticket ${ticket.code} actualizado — Palacio Gamer`,
        html,
      });
    }
  } catch (err) {
    console.error('Error enviando notificación de ticket:', err);
  }

  return ticket;
}

/**
 * Agregar comentario a un ticket.
 */
export async function addComment(
  ticketId: string,
  authorId: string,
  authorName: string,
  authorType: 'client' | 'employee',
  data: AddTicketCommentInput
) {
  await connectDB();

  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) throw new Error('Ticket no encontrado');

  ticket.comments.push({
    author: authorId as any,
    authorType,
    authorName,
    content: data.content,
    isInternal: authorType === 'employee' ? data.isInternal : false,
    attachments: data.attachments,
    createdAt: new Date(),
  });

  await ticket.save();

  return ticket;
}

/**
 * Obtener métricas de soporte para dashboard.
 */
export async function getTicketMetrics() {
  await connectDB();

  const [statusCounts, priorityCounts, categoryCounts, avgResolution] = await Promise.all([
    SupportTicket.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    SupportTicket.aggregate([
      { $match: { isActive: true, status: { $nin: ['FINALIZADO', 'ENTREGADO', 'CANCELADO'] } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    SupportTicket.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
    SupportTicket.aggregate([
      { $match: { completedDate: { $exists: true } } },
      {
        $project: {
          resolutionTime: { $subtract: ['$completedDate', '$createdAt'] },
        },
      },
      {
        $group: {
          _id: null,
          avgMs: { $avg: '$resolutionTime' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    byStatus: Object.fromEntries(statusCounts.map((s) => [s._id, s.count])),
    byPriority: Object.fromEntries(priorityCounts.map((p) => [p._id, p.count])),
    byCategory: Object.fromEntries(categoryCounts.map((c) => [c._id, c.count])),
    avgResolutionHours: avgResolution[0]
      ? Math.round((avgResolution[0].avgMs / (1000 * 60 * 60)) * 10) / 10
      : 0,
    totalResolved: avgResolution[0]?.count || 0,
  };
}
