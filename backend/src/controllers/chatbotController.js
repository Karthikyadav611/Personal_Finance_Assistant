const asyncHandler = require("../middleware/asyncHandler");
const { handleAssistantMessage } = require("../services/assistantService");

const chat = asyncHandler(async (req, res) => {
  const assistantResponse = await handleAssistantMessage({
    message: req.body?.message,
    user: req.user,
  });

  res.status(200).json({
    success: true,
    message: "Chatbot reply generated successfully",
    data: assistantResponse,
    reply: assistantResponse.reply,
  });
});

module.exports = { chat };
