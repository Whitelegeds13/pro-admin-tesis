/**
 * Quotation Service — Lógica de negocio de cotizaciones.
 *
 * Implementa:
 * - CRUD de cotizaciones
 * - Cálculos automáticos (subtotal, IGV, descuento, total)
 * - Conversión de cotización a venta
 * - Generación de datos para PDF
 * - Expiración automática
 */
import { connectDB } from '@/lib/mongodb';
import Quotation from '@/models/Quotation';
import Client from '@/models/Client';
import Sale from '@/models/Sale';
import SaleItem from '@/models/SaleItem';
import type { CreateQuotationInput, UpdateQuotationInput, QuotationQueryInput } from '@/core/dtos/quotation.dto';

const IGV_RATE = 0.18;

/**
 * Crear una cotización con cálculos automáticos.
 */
export async function createQuotation(employeeId: string, data: CreateQuotationInput) {
  await connectDB();

  const client = await Client.findById(data.clientId);
  if (!client) throw new Error('Cliente no encontrado');

  // Calcular totales
  const items = data.items.map((item) => ({
    product: item.product || undefined,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = subtotal * (data.discount / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const igv = data.includeIgv ? subtotalAfterDiscount * IGV_RATE : 0;
  const total = subtotalAfterDiscount + igv;

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + data.validDays);

  const quotation = new Quotation({
    client: data.clientId,
    createdBy: employeeId,
    items,
    currency: data.currency,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: data.discount,
    discountAmount: Math.round(discountAmount * 100) / 100,
    igv: Math.round(igv * 100) / 100,
    total: Math.round(total * 100) / 100,
    validUntil,
    notes: data.notes,
  });

  await quotation.save();

  return quotation.populate(['client', 'createdBy']);
}

/**
 * Obtener cotizaciones con filtros.
 */
export async function getQuotations(query: QuotationQueryInput) {
  await connectDB();

  // Expirar cotizaciones vencidas automáticamente
  await Quotation.updateMany(
    { status: { $in: ['DRAFT', 'SENT'] }, validUntil: { $lt: new Date() } },
    { $set: { status: 'EXPIRED' } }
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};

  if (query.status) filter.status = query.status;
  if (query.clientId) filter.client = query.clientId;
  if (query.search) {
    filter.$or = [
      { code: { $regex: query.search, $options: 'i' } },
      { notes: { $regex: query.search, $options: 'i' } },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [quotations, total] = await Promise.all([
    Quotation.find(filter)
      .populate('client', 'name email documentNumber phone')
      .populate('createdBy', 'name employeeId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    Quotation.countDocuments(filter),
  ]);

  return {
    quotations,
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  };
}

/**
 * Obtener cotización por ID.
 */
export async function getQuotationById(id: string) {
  await connectDB();

  const quotation = await Quotation.findById(id)
    .populate('client', 'name email documentNumber documentType phone address city district')
    .populate('createdBy', 'name employeeId email')
    .lean();

  if (!quotation) throw new Error('Cotización no encontrada');

  return quotation;
}

/**
 * Actualizar cotización (solo DRAFT).
 */
export async function updateQuotation(id: string, data: UpdateQuotationInput) {
  await connectDB();

  const quotation = await Quotation.findById(id);
  if (!quotation) throw new Error('Cotización no encontrada');

  if (quotation.status !== 'DRAFT' && !data.status) {
    throw new Error('Solo se pueden editar cotizaciones en estado BORRADOR');
  }

  if (data.status) quotation.status = data.status;
  if (data.notes !== undefined) quotation.notes = data.notes;

  if (data.items) {
    const items = data.items.map((item) => ({
      product: item.product || undefined,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
    }));

    const discount = data.discount ?? quotation.discount;
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = subtotal * (discount / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const igv = subtotalAfterDiscount * IGV_RATE;
    const total = subtotalAfterDiscount + igv;

    quotation.items = items as any;
    quotation.subtotal = Math.round(subtotal * 100) / 100;
    quotation.discount = discount;
    quotation.discountAmount = Math.round(discountAmount * 100) / 100;
    quotation.igv = Math.round(igv * 100) / 100;
    quotation.total = Math.round(total * 100) / 100;
  }

  if (data.validDays) {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + data.validDays);
    quotation.validUntil = validUntil;
  }

  await quotation.save();

  return quotation;
}

/**
 * Convertir cotización aprobada en venta.
 */
export async function convertToSale(
  quotationId: string,
  employeeId: string,
  paymentMethod: string
) {
  await connectDB();

  const quotation = await Quotation.findById(quotationId).populate('client');
  if (!quotation) throw new Error('Cotización no encontrada');

  if (quotation.status !== 'APPROVED') {
    throw new Error('Solo se pueden convertir cotizaciones aprobadas');
  }

  // Generar número de venta
  const saleCount = await Sale.countDocuments();
  const saleNumber = `V-${String(saleCount + 1).padStart(6, '0')}`;

  // Crear items de venta
  const saleItems = await Promise.all(
    quotation.items.map(async (item: any) => {
      const saleItem = new SaleItem({
        product: item.product,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.subtotal,
      });
      await saleItem.save();
      return saleItem._id;
    })
  );

  // Crear venta
  const sale = new Sale({
    saleNumber,
    client: quotation.client._id,
    employee: employeeId,
    receiptType: 'BOLETA',
    receiptNumber: saleNumber,
    series: 'B001',
    paymentMethod: paymentMethod || 'EFECTIVO',
    subtotal: quotation.subtotal,
    igv: quotation.igv,
    total: quotation.total,
    items: saleItems,
    status: 'PENDIENTE',
    notes: `Generada desde cotización ${quotation.code}`,
  });

  await sale.save();

  // Marcar cotización como convertida
  quotation.status = 'CONVERTED';
  quotation.convertedSaleId = sale._id as any;
  await quotation.save();

  return { sale, quotation };
}

/**
 * Generar datos para PDF de cotización.
 */
export async function getQuotationPdfData(id: string) {
  await connectDB();

  const quotation = await Quotation.findById(id)
    .populate('client', 'name email documentNumber documentType phone address city district')
    .populate('createdBy', 'name employeeId')
    .lean();

  if (!quotation) throw new Error('Cotización no encontrada');

  const currencySymbol = { PEN: 'S/', USD: '$', EUR: '€' }[quotation.currency] || 'S/';

  return {
    quotation,
    currencySymbol,
    company: {
      name: 'Palacio Gamer S.A.C.',
      ruc: '20123456789',
      address: 'Av. Ejemplo 1234, Lima, Perú',
      phone: '+51 999 999 999',
      email: 'ventas@palaciogamer.com',
    },
    generatedAt: new Date().toISOString(),
  };
}
