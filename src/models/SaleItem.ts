import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISaleItem extends Document {
  sale: Types.ObjectId;
  product: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  discount?: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema: Schema = new Schema({
  sale: {
    type: Schema.Types.ObjectId,
    ref: 'Sale',
    required: [true, 'Sale is required']
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price must be non-negative']
  },
  discount: {
    type: Number,
    min: [0, 'Discount must be non-negative'],
    default: 0
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal must be non-negative']
  }
}, {
  timestamps: true
});

// Indexes
SaleItemSchema.index({ sale: 1 });
SaleItemSchema.index({ product: 1 });

// Pre-save middleware to calculate subtotal
SaleItemSchema.pre('save', function(this: { quantity: number; unitPrice: number; discount?: number; subtotal: number }, next) {
  this.subtotal = (this.quantity * this.unitPrice) - (this.discount || 0);
  next();
});

// Method to get safe sale item data
SaleItemSchema.methods.toSafeObject = function() {
  const saleItem = this.toObject();
  return saleItem;
};

export default mongoose.models.SaleItem || mongoose.model<ISaleItem>('SaleItem', SaleItemSchema);
