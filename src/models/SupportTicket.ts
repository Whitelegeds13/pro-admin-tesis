/**
 * SupportTicket Model — Sistema HelpDesk Enterprise.
 *
 * Mejoras sobre el modelo anterior:
 * - Estados tipo workflow: recibido → diagnóstico → reparación → finalizado
 * - Prioridades con SLA
 * - Comentarios técnicos con timeline
 * - Adjuntos de imágenes
 * - Asignación de técnico
 * - Historial de cambios de estado
 */
import mongoose, { Document, Schema, Types } from 'mongoose';

// ─── Interfaces ──────────────────────────────────────────────

export interface ITicketComment {
  author: Types.ObjectId;
  authorType: 'client' | 'employee';
  authorName: string;
  content: string;
  isInternal: boolean; // Notas internas (solo visible por staff)
  attachments: string[];
  createdAt: Date;
}

export interface ITicketStatusChange {
  from: string;
  to: string;
  changedBy: Types.ObjectId;
  changedByName: string;
  reason?: string;
  timestamp: Date;
}

export interface ISupportTicket extends Document {
  code: string;
  client: Types.ObjectId;
  subject: string;
  description: string;
  category: 'HARDWARE' | 'SOFTWARE' | 'NETWORK' | 'PERIPHERAL' | 'WARRANTY' | 'OTHER';
  status: 'RECIBIDO' | 'DIAGNOSTICO' | 'REPARACION' | 'ESPERANDO_REPUESTO' | 'FINALIZADO' | 'ENTREGADO' | 'CANCELADO';
  priority: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  assignedTo?: Types.ObjectId;
  deviceInfo?: {
    type: string;      // "Laptop", "PC", "Monitor", etc.
    brand: string;
    model: string;
    serialNumber?: string;
  };
  estimatedCost?: number;
  finalCost?: number;
  estimatedDate?: Date;
  completedDate?: Date;
  comments: ITicketComment[];
  statusHistory: ITicketStatusChange[];
  attachments: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-Schemas ─────────────────────────────────────────────

const TicketCommentSchema = new Schema<ITicketComment>({
  author: { type: Schema.Types.ObjectId, required: true },
  authorType: { type: String, enum: ['client', 'employee'], required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true, maxlength: 2000 },
  isInternal: { type: Boolean, default: false },
  attachments: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const StatusChangeSchema = new Schema<ITicketStatusChange>({
  from: { type: String, required: true },
  to: { type: String, required: true },
  changedBy: { type: Schema.Types.ObjectId, required: true },
  changedByName: { type: String, required: true },
  reason: { type: String },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

// ─── Main Schema ─────────────────────────────────────────────

const SupportTicketSchema: Schema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000,
  },
  category: {
    type: String,
    enum: ['HARDWARE', 'SOFTWARE', 'NETWORK', 'PERIPHERAL', 'WARRANTY', 'OTHER'],
    default: 'OTHER',
  },
  status: {
    type: String,
    enum: ['RECIBIDO', 'DIAGNOSTICO', 'REPARACION', 'ESPERANDO_REPUESTO', 'FINALIZADO', 'ENTREGADO', 'CANCELADO'],
    default: 'RECIBIDO',
  },
  priority: {
    type: String,
    enum: ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'],
    default: 'MEDIA',
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
  },
  deviceInfo: {
    type: {
      type: String,
    },
    brand: String,
    model: String,
    serialNumber: String,
  },
  estimatedCost: { type: Number, min: 0 },
  finalCost: { type: Number, min: 0 },
  estimatedDate: { type: Date },
  completedDate: { type: Date },
  comments: [TicketCommentSchema],
  statusHistory: [StatusChangeSchema],
  attachments: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// ─── Indexes ─────────────────────────────────────────────────

SupportTicketSchema.index({ client: 1 });
SupportTicketSchema.index({ status: 1 });
SupportTicketSchema.index({ priority: 1 });
SupportTicketSchema.index({ assignedTo: 1 });
SupportTicketSchema.index({ code: 1 });
SupportTicketSchema.index({ createdAt: -1 });
SupportTicketSchema.index({ category: 1, status: 1 });

// ─── Auto-generate code ─────────────────────────────────────

SupportTicketSchema.pre('save', async function (next) {
  if (this.isNew && !this.code) {
    const count = await mongoose.model('SupportTicket').countDocuments();
    this.code = `TK-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// ─── Export ──────────────────────────────────────────────────

if (mongoose.models.SupportTicket) {
  delete mongoose.models.SupportTicket;
}

export default mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
