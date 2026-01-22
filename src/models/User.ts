import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, UserStatus } from '../types/enums';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  suspendedUntil?: Date;
  suspensionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive(): boolean;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.BUYER
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE
    },
    suspendedUntil: {
      type: Date
    },
    suspensionReason: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Check if user suspension has expired
UserSchema.methods.isActive = function(): boolean {
  if (this.status === UserStatus.SUSPENDED && this.suspendedUntil) {
    if (new Date() > this.suspendedUntil) {
      return true;
    }
    return false;
  }
  return this.status === UserStatus.ACTIVE;
};

export default mongoose.model<IUser>('User', UserSchema);
