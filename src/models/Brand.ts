import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  supplier?: Types.ObjectId;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  productCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
BrandSchema.index({ isActive: 1 });
BrandSchema.index({ supplier: 1 });

// Method to get safe brand data
BrandSchema.methods.toSafeObject = function() {
  const brand = this.toObject();
  return brand;
};

export default mongoose.models.Brand || mongoose.model<IBrand>('Brand', BrandSchema);
