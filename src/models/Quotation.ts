/**
 * Quotation Model — Sistema de cotizaciones mejorado.
 *
 * Incluye: descuento, conversión a venta, validez, y tracking de estados.
 */
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IQuotationItem {
  product?: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface IQuotation extends Document {
  code: string;
  client: Types.ObjectId;
  createdBy: Types.ObjectId;
  items: IQuotationItem[];
  currency: 'PEN' | 'USD' | 'EUR';
  subtotal: number;
  discount: number;      // Porcentaje de descuento
  discountAmount: number; // Monto del descuento
  igv: number;
  total: number;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'EXPIRED' | 'CONVERTED';
  validUntil: Date;
  convertedSaleId?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationItemSchema = new Schema<IQuotationItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const QuotationSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true, trim: true },
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  items: { type: [QuotationItemSchema], default: [] },
  currency: { type: String, enum: ['PEN', 'USD', 'EUR'], default: 'PEN' },
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  discountAmount: { type: Number, default: 0, min: 0 },
  igv: { type: Number, required: true, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['DRAFT', 'SENT', 'APPROVED', 'EXPIRED', 'CONVERTED'], default: 'DRAFT' },
  validUntil: { type: Date, required: true },
  convertedSaleId: { type: Schema.Types.ObjectId, ref: 'Sale' },
  notes: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true });

QuotationSchema.index({ client: 1 });
QuotationSchema.index({ code: 1 });
QuotationSchema.index({ status: 1 });
QuotationSchema.index({ createdAt: -1 });
QuotationSchema.index({ validUntil: 1 });

// Auto-generate code
QuotationSchema.pre('save', async function (next) {
  if (this.isNew && !this.code) {
    const count = await mongoose.model('Quotation').countDocuments();
    this.code = `COT-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

if (mongoose.models.Quotation) {
  delete mongoose.models.Quotation;
}

export default mongoose.model<IQuotation>('Quotation', QuotationSchema);
