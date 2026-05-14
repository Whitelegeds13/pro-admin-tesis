import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Role description is required'],
    trim: true
  },
  permissions: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
RoleSchema.index({ isActive: 1 });

// Method to get safe role data
RoleSchema.methods.toSafeObject = function() {
  const role = this.toObject();
  return role;
};

export default mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);