import { config } from '../config';

export const validateCampusEmail = (email: string): boolean => {
  return email.endsWith(config.campusEmailDomain);
};

export const sanitizeUser = (user: any) => {
  const { password, verificationToken, resetPasswordToken, refreshTokens, ...safeUser } = user.toObject();
  return safeUser;
};
