const asyncHandler = require("../middleware/asyncHandler");
const { handleAiChat } = require("../services/ai/orchestrator");

const chat = asyncHandler(async (req, res) => {
  const assistantResponse = await handleAiChat({
    message: req.body?.message,
    user: req.user,
  });

  // Keep this endpoint backward-compatible with the existing frontend which reads:
  // - `reply` (top-level)
  // - `data.action.performed` and `data.suggestions`
  res.status(200).json({
    success: true,
    message: "Chatbot reply generated successfully",
    // "Structured" fields (also returned in `data` for compatibility)
    intent: assistantResponse.intent,
    agent: assistantResponse.agent,
    reply: assistantResponse.reply,
    action: assistantResponse.action,
    suggestions: assistantResponse.suggestions,
    context: assistantResponse.context,

    // Compatibility payload (legacy UI expects this nesting)
    data: assistantResponse,
  });
});

module.exports = { chat };
