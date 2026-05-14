import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISupportChatMessage extends Document {
  ticket: Types.ObjectId;
  senderType: 'client' | 'admin';
  sender?: Types.ObjectId | null;
  message?: string;
  imageUrl?: string;
  imageUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SupportChatMessageSchema: Schema = new Schema({
  ticket: { type: Schema.Types.ObjectId, ref: 'SupportTicket', required: true, index: true },
  senderType: { type: String, enum: ['client', 'admin'], required: true },
  sender: { type: Schema.Types.ObjectId, refPath: 'senderType', default: null },
  message: { type: String, trim: true },
  imageUrl: { type: String, trim: true },
  imageUrls: { type: [String], default: [] }
}, { timestamps: true });

SupportChatMessageSchema.index({ ticket: 1, createdAt: 1 });

if (mongoose.models.SupportChatMessage) {
  delete mongoose.models.SupportChatMessage;
}

export default mongoose.model<ISupportChatMessage>('SupportChatMessage', SupportChatMessageSchema);
