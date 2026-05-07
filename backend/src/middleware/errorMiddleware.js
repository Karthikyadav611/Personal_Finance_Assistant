const notFound = (req, res, _next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
    data: null,
  });
};

const errorHandler = (err, _req, res, _next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  if (err.message === "CORS policy blocked this request") {
    return res.status(403).json({
      success: false,
      message: err.message,
      data: null,
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Request body contains invalid JSON",
      data: null,
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors)
        .map((item) => item.message)
        .join(", "),
      data: null,
    });
  }

  if (err.code === 11000) {
    const duplicateFields = Object.keys(err.keyValue || {});
    const fieldLabel = duplicateFields.length > 0 ? duplicateFields.join(" and ") : "field";
    return res.status(409).json({
      success: false,
      message: `${fieldLabel} already exists`,
      data: null,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid resource identifier",
      data: null,
    });
  }

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    data: null,
  });
};

module.exports = { notFound, errorHandler };
