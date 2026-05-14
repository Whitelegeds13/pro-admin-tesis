import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPurchaseItem extends Document {
  purchase: Types.ObjectId;
  product: Types.ObjectId;
  quantity: number;
  unitCost: number;
  subtotal: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseItemSchema: Schema = new Schema({
  purchase: { type: Schema.Types.ObjectId, ref: 'Purchase', required: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

PurchaseItemSchema.index({ purchase: 1 });
PurchaseItemSchema.index({ product: 1 });

// Method to get safe object without sensitive data
PurchaseItemSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  return {
    _id: obj._id,
    purchase: obj.purchase,
    product: obj.product,
    quantity: obj.quantity,
    unitCost: obj.unitCost,
    subtotal: obj.subtotal,
    isActive: obj.isActive,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

export default mongoose.models.PurchaseItem || mongoose.model<IPurchaseItem>('PurchaseItem', PurchaseItemSchema);
