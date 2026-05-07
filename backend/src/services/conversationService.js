const AssistantConversation = require("../models/AssistantConversation");

const MAX_STORED_MESSAGES = 12;

const getConversation = async (userId) => {
  const conversation = await AssistantConversation.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, messages: [] } },
    { new: true, upsert: true }
  );

  return conversation;
};

const getRecentMessages = async (userId) => {
  const conversation = await getConversation(userId);
  return conversation.messages.slice(-MAX_STORED_MESSAGES);
};

const appendConversationExchange = async (userId, userMessage, assistantMessage, category) => {
  const conversation = await getConversation(userId);

  conversation.messages.push(
    {
      role: "user",
      content: userMessage,
      category,
      createdAt: new Date(),
    },
    {
      role: "assistant",
      content: assistantMessage,
      category,
      createdAt: new Date(),
    }
  );

  if (conversation.messages.length > MAX_STORED_MESSAGES) {
    conversation.messages = conversation.messages.slice(-MAX_STORED_MESSAGES);
  }

  await conversation.save();
};

module.exports = {
  getRecentMessages,
  appendConversationExchange,
};
