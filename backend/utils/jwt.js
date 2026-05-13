const jwt = require('jsonwebtoken');

const signAccessToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required.');
  }

  return jwt.sign(
    {
      role: user.role,
      email: user.email
    },
    process.env.JWT_SECRET,
    {
      subject: String(user._id),
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

module.exports = { signAccessToken };
