const asyncHandler = require("../middleware/asyncHandler");
const { sendSuccess } = require("../utils/response");

const getProfile = asyncHandler(async (req, res) => {
  const user = {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    createdAt: req.user.createdAt,
  };

  sendSuccess(res, 200, "User profile fetched successfully", user);
});

module.exports = { getProfile };
