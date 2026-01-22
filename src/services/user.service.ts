import User from '../models/User.model';
import { IUser } from '../types/user.types';

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  campusLocation?: string;
}

export class UserService {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: UpdateProfileData): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update only provided fields
    if (updateData.name !== undefined) {
      user.name = updateData.name;
    }
    if (updateData.phone !== undefined) {
      user.phone = updateData.phone;
    }
    if (updateData.campusLocation !== undefined) {
      user.campusLocation = updateData.campusLocation;
    }

    await user.save();
    return user;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  /**
   * Check if user exists
   */
  async userExists(email: string): Promise<boolean> {
    const user = await User.findOne({ email });
    return !!user;
  }
}

export default new UserService();
