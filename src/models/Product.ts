import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProduct extends Document {
  code: string;
  name: string;
  description?: string;
  brand: Types.ObjectId;
  category: Types.ObjectId;
  price: number;
  costPrice?: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  images: string[];
  specifications?: Record<string, string | number | boolean>;
  tags: string[];
  isActive: boolean;
  isDigital: boolean;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  sku?: string;
  barcode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
  code: {
    type: String,
    required: [true, 'Product code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'Brand',
    required: [true, 'Brand is required']
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price must be positive']
  },
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: [0, 'Stock must be non-negative'],
    default: 0
  },
  minStock: {
    type: Number,
    required: [true, 'Minimum stock is required'],
    min: [0, 'Minimum stock must be non-negative'],
    default: 0
  },
  maxStock: {
    type: Number,
    min: [0, 'Maximum stock must be positive']
  },
  images: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Schema.Types.Mixed,
    default: {}
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isDigital: {
    type: Boolean,
    default: false
  },
  weight: {
    type: Number,
    min: [0, 'Weight must be non-negative']
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  sku: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  barcode: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
ProductSchema.index({ code: 1 });
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ stock: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ tags: 1 });

// Virtual for low stock alert
ProductSchema.virtual('isLowStock').get(function(this: { stock: number; minStock: number }) {
  return this.stock <= this.minStock;
});

// Virtual for profit margin
ProductSchema.virtual('profitMargin').get(function(this: { costPrice?: number; price: number }) {
  if (this.costPrice && this.price > 0) {
    return ((this.price - this.costPrice) / this.price) * 100;
  }
  return 0;
});

// Method to get safe product data
ProductSchema.methods.toSafeObject = function() {
  const product = this.toObject();
  return product;
};

// Static method to find low stock products
ProductSchema.statics.findLowStock = function() {
  return this.find({
    $expr: { $lte: ['$stock', '$minStock'] },
    isActive: true
  });
};

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
