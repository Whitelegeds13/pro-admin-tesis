import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IStockMovement extends Document {
  product: Types.ObjectId;
  type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'transfer' | 'damage' | 'expired';
  quantity: number; // Positive for additions, negative for subtractions
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: Types.ObjectId; // Reference to Sale, Purchase, etc.
  referenceType?: 'sale' | 'purchase' | 'adjustment' | 'return' | 'transfer' | 'damage' | 'expired';
  employee: Types.ObjectId;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StockMovementSchema: Schema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { 
    type: String, 
    enum: ['sale', 'purchase', 'adjustment', 'return', 'transfer', 'damage', 'expired'], 
    required: true 
  },
  quantity: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  reason: { type: String, required: true, trim: true },
  reference: { type: Schema.Types.ObjectId },
  referenceType: { 
    type: String, 
    enum: ['sale', 'purchase', 'adjustment', 'return', 'transfer', 'damage', 'expired'] 
  },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  notes: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

StockMovementSchema.index({ product: 1 });
StockMovementSchema.index({ type: 1 });
StockMovementSchema.index({ createdAt: -1 });
StockMovementSchema.index({ employee: 1 });

// Method to get safe object without sensitive data
StockMovementSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  return {
    _id: obj._id,
    product: obj.product,
    type: obj.type,
    quantity: obj.quantity,
    previousStock: obj.previousStock,
    newStock: obj.newStock,
    reason: obj.reason,
    reference: obj.reference,
    referenceType: obj.referenceType,
    employee: obj.employee,
    notes: obj.notes,
    isActive: obj.isActive,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

export default mongoose.models.StockMovement || mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
