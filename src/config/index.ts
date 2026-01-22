export const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  disputeTimeLimitDays: parseInt(process.env.DISPUTE_TIME_LIMIT_DAYS || '7', 10),
  escrowReleaseDelayHours: parseInt(process.env.ESCROW_RELEASE_DELAY_HOURS || '24', 10)
};
