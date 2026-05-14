import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  documentType: 'DNI' | 'RUC' | 'CE' | 'PASSPORT';
  documentNumber: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  contactPerson?: string;
  website?: string;
  logo?: string;
  isActive: boolean;
  totalPurchases: number;
  lastPurchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true
  },
  documentType: {
    type: String,
    enum: ['DNI', 'RUC', 'CE', 'PASSPORT'],
    required: [true, 'Document type is required']
  },
  documentNumber: {
    type: String,
    required: [true, 'Document number is required'],
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  lastPurchaseDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
SupplierSchema.index({ isActive: 1 });
SupplierSchema.index({ name: 'text', email: 'text' });

// Method to get safe supplier data
SupplierSchema.methods.toSafeObject = function() {
  const supplier = this.toObject();
  return supplier;
};

export default mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);
