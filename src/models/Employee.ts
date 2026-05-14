import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IEmployee extends Document {
  employeeId: string;
  password: string;
  name: string;
  email: string;
  role: Types.ObjectId; // Referencia al modelo Role
  department: Types.ObjectId; // Referencia al modelo Department
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema: Schema = new Schema({
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  role: {
    type: Schema.Types.ObjectId,
    ref: 'Role',
    required: [true, 'Role is required']
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
EmployeeSchema.index({ isActive: 1 });

// Pre-save middleware to hash password
EmployeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
EmployeeSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    const password = this.password || this.get('password');
    if (!password) return false;
    return await bcrypt.compare(candidatePassword, password);
  } catch (error) {
    console.error('Error in comparePassword:', error);
    return false;
  }
};

// Method to get safe employee data (without password)
EmployeeSchema.methods.toSafeObject = function() {
  const employee = this.toObject();
  delete employee.password;
  return employee;
};

// Eliminar el modelo de la caché si existe para forzar la actualización
// Esto es necesario en Next.js debido al hot reload
if (mongoose.models.Employee) {
  delete mongoose.models.Employee;
}

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);