import mongoose, { Schema, Document } from 'mongoose';
import { AuditAction } from '../types/enums';

export interface IAuditLog extends Document {
  action: AuditAction;
  performedBy: mongoose.Types.ObjectId;
  targetUser?: mongoose.Types.ObjectId;
  targetResource?: {
    type: string;
    id: mongoose.Types.ObjectId;
  };
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    targetResource: {
      type: {
        type: String,
        enum: ['Dispute', 'Escrow', 'Auction', 'User']
      },
      id: {
        type: Schema.Types.ObjectId
      }
    },
    details: {
      type: Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Index for efficient queries
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ performedBy: 1, createdAt: -1 });
AuditLogSchema.index({ targetUser: 1, createdAt: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
