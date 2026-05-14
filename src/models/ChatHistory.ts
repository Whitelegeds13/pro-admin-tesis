/**
 * Modelo de Historial de Chat — Persiste conversaciones del chatbot.
 *
 * Almacena sesiones de chat completas asociadas a un cliente,
 * permitiendo memoria contextual y análisis de conversaciones.
 */
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    tokensUsed?: number;
    productsRecommended?: string[];
    detectedCareer?: string;
  };
}

export interface IChatHistory extends Document {
  client: Types.ObjectId;
  sessionId: string;
  messages: IChatMessage[];
  context: {
    detectedCareer?: string;
    detectedProfession?: string;
    preferences?: string[];
    lastRecommendedProducts?: string[];
  };
  isActive: boolean;
  totalTokensUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 8000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      tokensUsed: Number,
      productsRecommended: [String],
      detectedCareer: String,
    },
  },
  { _id: false }
);

const ChatHistorySchema: Schema = new Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    messages: {
      type: [ChatMessageSchema],
      default: [],
      validate: {
        validator: function (v: IChatMessage[]) {
          return v.length <= 100; // Máximo 100 mensajes por sesión
        },
        message: 'Una sesión no puede tener más de 100 mensajes',
      },
    },
    context: {
      detectedCareer: String,
      detectedProfession: String,
      preferences: [String],
      lastRecommendedProducts: [String],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalTokensUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para consultas eficientes
ChatHistorySchema.index({ client: 1, isActive: 1 });
ChatHistorySchema.index({ client: 1, createdAt: -1 });
ChatHistorySchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // TTL: 30 días

export default mongoose.models.ChatHistory ||
  mongoose.model<IChatHistory>('ChatHistory', ChatHistorySchema);
