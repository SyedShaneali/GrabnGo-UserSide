// api/chatApi.js
import api from "./axiosClient";

/**
 * Start a new chat conversation with another user (or support)
 * POST /chat/?receiver_id={receiverId}
 */
export const startChatApi = async (receiverId) => {
    console.log("getting receiver id", receiverId);
  const res = await api.post(`/user/chat/?receiver_id=${receiverId}`);
  return res.data?.data ?? res.data;
};

/**
 * Load messages for a chat by chat ID
 * GET /messages/chat/{chatId}
 */
export const getMessagesApi = async (chatId, page = 1, limit = 50) => {
  const res = await api.get(`/user/messages/chat/${chatId}`, {
    params: { page, limit },
  });
  return res.data?.data ?? res.data;
};

/**
 * Get the list of the logged-in user's own chats
 * GET /chat/
 */
export const getUserChatsApi = async ({ page = 1, limit = 10 } = {}) => {
  const res = await api.get("/user/chat/", {
    params: { page, limit },
  });
  return res.data;
};

// NOTE: no deactivateChatApi here — per the back-office pattern, only
// back-office can deactivate a chat. If the user-side API later exposes a
// way to view whether a chat was deactivated (e.g. an `is_active` flag on
// the chat object returned by startChatApi/getUserChatsApi), wire that into
// useChat's `isClosed` state to disable the input — see the TODO in useChat.js.