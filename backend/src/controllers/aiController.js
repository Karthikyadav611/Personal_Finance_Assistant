const asyncHandler = require("../middleware/asyncHandler");
const { handleAiChat } = require("../services/ai/orchestrator");
// POST /api/ai/chat
const chat = asyncHandler(async (req, res) => {
  const message = req.body?.message;

  const result = await handleAiChat({
    message,
    user: req.user,
  });

  res.status(200).json({
    success: true,
    message: "AI chat response generated successfully",
    intent: result.intent,
    agent: result.agent,
    reply: result.reply,
    data: result.data,
    action: result.action,
    suggestions: result.suggestions,
    context: result.context,
  });
});

module.exports = { chat };
