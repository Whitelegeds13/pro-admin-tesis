import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPurchase extends Document {
  supplier: Types.ObjectId;
  employee: Types.ObjectId;
  orderNumber: string;
  invoiceNumber?: string;
  invoiceDate?: Date;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  originalListVoucher?: string;
  notes?: string;
  total: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseSchema: Schema = new Schema({
  supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  orderNumber: { type: String, required: true, unique: true, trim: true },
  invoiceNumber: { type: String, trim: true },
  invoiceDate: { type: Date },
  orderDate: { type: Date, required: true, default: Date.now },
  expectedDeliveryDate: { type: Date },
  actualDeliveryDate: { type: Date },
  status: { 
    type: String, 
    enum: ['pending', 'ordered', 'received', 'cancelled'], 
    default: 'pending' 
  },
  originalListVoucher: { type: String },
  notes: { type: String, trim: true },
  total: { type: Number, required: true, default: 0, min: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

PurchaseSchema.index({ isActive: 1 });
PurchaseSchema.index({ supplier: 1 });
PurchaseSchema.index({ employee: 1 });
PurchaseSchema.index({ orderDate: -1 });
PurchaseSchema.index({ orderNumber: 1 });

// Method to get safe object without sensitive data
PurchaseSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  return {
    _id: obj._id,
    supplier: obj.supplier,
    employee: obj.employee,
    orderNumber: obj.orderNumber,
    invoiceNumber: obj.invoiceNumber,
    invoiceDate: obj.invoiceDate,
    orderDate: obj.orderDate,
    expectedDeliveryDate: obj.expectedDeliveryDate,
    actualDeliveryDate: obj.actualDeliveryDate,
    status: obj.status,
    originalListVoucher: obj.originalListVoucher,
    notes: obj.notes,
    total: obj.total,
    isActive: obj.isActive,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

export default mongoose.models.Purchase || mongoose.model<IPurchase>('Purchase', PurchaseSchema);
