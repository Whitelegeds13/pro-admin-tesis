import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description: string;
  parentCategory?: Types.ObjectId;
  image?: string;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Category description is required'],
    trim: true
  },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  image: {
    type: String,
    trim: true
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
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ parentCategory: 1 });

// Method to get safe category data
CategorySchema.methods.toSafeObject = function() {
  const category = this.toObject();
  return category;
};

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
