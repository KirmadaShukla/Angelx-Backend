const sendToken = (user, statusCode, res, type = 'user') => {
  // Generate JWT token
  const token = user.getJwtToken();
  
  // Options for cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  // Determine cookie name based on user type
  const cookieName = type === 'admin' ? 'adminToken' : 'token';

  res.status(statusCode).cookie(cookieName, token, options).json({
    success: true,
    token,
    data: {
      user
    }
  });
};

module.exports = sendToken;