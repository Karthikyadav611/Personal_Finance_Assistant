const sendSuccess = (res, statusCode, message, data = null, extra = {}) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    ...extra,
  });
};

module.exports = { sendSuccess };
