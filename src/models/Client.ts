import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IClient extends Document {
  name: string;
  documentType: 'DNI' | 'RUC' | 'CE' | 'PASSPORT';
  documentNumber: string;
  phone: string;
  email: string;
  password: string;
  address?: string;
  city?: string;
  district?: string;
  isActive: boolean;
  totalPurchases: number;
  lastPurchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const ClientSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Client name is required'],
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
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // No incluir password por defecto en las consultas
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  district: {
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
  },
  resetPasswordToken: {
    type: String,
    index: true
  },
  resetPasswordExpires: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
ClientSchema.index({ documentNumber: 1 });
ClientSchema.index({ email: 1 });
ClientSchema.index({ isActive: 1 });
ClientSchema.index({ name: 'text', email: 'text' });

// Hash password before saving
ClientSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const password = this.password as string;
    this.password = await bcrypt.hash(password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
ClientSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get safe client data (without password)
ClientSchema.methods.toSafeObject = function() {
  const client = this.toObject();
  delete client.password;
  return client;
};

export default mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);
