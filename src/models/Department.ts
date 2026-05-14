import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description: string;
  manager?: string; // Employee ID of the manager
  budget?: number;
  location: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Department description is required'],
    trim: true
  },
  manager: {
    type: String,
    trim: true,
    uppercase: true
  },
  budget: {
    type: Number,
    min: [0, 'Budget cannot be negative']
  },
  location: {
    type: String,
    required: [true, 'Department location is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
DepartmentSchema.index({ isActive: 1 });
DepartmentSchema.index({ manager: 1 });

// Method to get safe department data
DepartmentSchema.methods.toSafeObject = function() {
  const department = this.toObject();
  return department;
};

export default mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);