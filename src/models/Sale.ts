import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISale extends Document {
  saleNumber: string;
  client: Types.ObjectId;
  employee: Types.ObjectId;
  receiptType: 'FACTURA' | 'BOLETA' | 'TICKET';
  receiptNumber: string;
  series: string;
  currency: 'PEN' | 'USD' | 'EUR';
  exchangeRate: number;
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | 'QR' | 'APP';
  issueDate: Date;
  dueDate?: Date;
  status: 'SOLICITADO' | 'PENDIENTE' | 'CONFIRMADO' | 'PAGADO' | 'CANCELADO' | 'DEVUELTO';
  paymentProofImage?: string;
  confirmedBy?: Types.ObjectId;
  confirmedAt?: Date;
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  subtotal: number;
  igv: number;
  total: number;
  items: Types.ObjectId[];
  delivery?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema: Schema = new Schema({
  saleNumber: {
    type: String,
    required: [true, 'Sale number is required'],
    unique: true,
    trim: true
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required']
  },
  employee: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee is required']
  },
  receiptType: {
    type: String,
    enum: ['FACTURA', 'BOLETA', 'TICKET'],
    required: [true, 'Receipt type is required']
  },
  receiptNumber: {
    type: String,
    required: [true, 'Receipt number is required'],
    trim: true
  },
  series: {
    type: String,
    required: [true, 'Series is required'],
    trim: true
  },
  currency: {
    type: String,
    enum: ['PEN', 'USD', 'EUR'],
    default: 'PEN'
  },
  exchangeRate: {
    type: Number,
    default: 1,
    min: [0, 'Exchange rate must be positive']
  },
  paymentMethod: {
    type: String,
    enum: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'YAPE', 'PLIN', 'QR', 'APP'],
    required: [true, 'Payment method is required']
  },
  issueDate: {
    type: Date,
    required: [true, 'Issue date is required'],
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['SOLICITADO', 'PENDIENTE', 'CONFIRMADO', 'PAGADO', 'CANCELADO', 'DEVUELTO'],
    default: 'SOLICITADO'
  },
  paymentProofImage: {
    type: String,
    trim: true
  },
  confirmedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Employee'
  },
  confirmedAt: {
    type: Date
  },
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Employee'
  },
  processedAt: {
    type: Date
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal must be non-negative']
  },
  igv: {
    type: Number,
    required: [true, 'IGV is required'],
    min: [0, 'IGV must be non-negative'],
    default: 0
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total must be non-negative']
  },
  items: [{
    type: Schema.Types.ObjectId,
    ref: 'SaleItem'
  }],
  delivery: {
    type: Schema.Types.ObjectId,
    ref: 'Delivery'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
SaleSchema.index({ saleNumber: 1 });
SaleSchema.index({ client: 1 });
SaleSchema.index({ employee: 1 });
SaleSchema.index({ issueDate: -1 });
SaleSchema.index({ status: 1 });
SaleSchema.index({ processedAt: 1 });
SaleSchema.index({ receiptType: 1, receiptNumber: 1 });

// Method to get safe sale data
SaleSchema.methods.toSafeObject = function() {
  const sale = this.toObject();
  return sale;
};

// Eliminar el modelo de la caché si existe para forzar la actualización
if (mongoose.models.Sale) {
  delete mongoose.models.Sale;
}

export default mongoose.model<ISale>('Sale', SaleSchema);
