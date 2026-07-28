const Message = require('../models/Message');
const Room = require('../models/Room');
const { getIsConnected } = require('../config/db');
const { memoryStore } = require('../controllers/roomController');
const { streamAIResponse } = require('../services/ai/geminiService');
const { v4: uuidv4 } = require('uuid');

const registerChatHandlers = (io, socket) => {

  // Event: send_prompt (Executes AI prompt with token streaming)
  socket.on('send_prompt', async ({ roomId, prompt, role, author, originalMessageId = null }) => {
    if (!roomId || !prompt || !prompt.trim()) return;

    const activeRole = role || 'Coder AI';
    const messageId = originalMessageId || uuidv4();
    const timestamp = new Date();

    // Fetch conversation history for AI context
    let conversationHistory = [];
    let existingMsg = null;

    if (getIsConnected()) {
      try {
        conversationHistory = await Message.find({ roomId }).sort({ timestamp: 1 }).limit(10);
        if (originalMessageId) {
          existingMsg = await Message.findOne({ messageId: originalMessageId });
        }
      } catch (err) {
        console.error('[Chat Context DB Error]', err.message);
      }
    } else {
      const roomMsgs = memoryStore.messages.get(roomId) || [];
      conversationHistory = roomMsgs.slice(-10);
      if (originalMessageId) {
        existingMsg = roomMsgs.find(m => m.messageId === originalMessageId);
      }
    }

    let version = 1;
    let versionsArray = [];

    if (existingMsg) {
      // Re-running or editing an existing prompt creates a new version entry!
      version = (existingMsg.version || 1) + 1;
      versionsArray = existingMsg.versions || [];
      // Push current state as a version snapshot before updating
      versionsArray.push({
        versionNumber: existingMsg.version,
        prompt: existingMsg.prompt,
        response: existingMsg.response,
        role: existingMsg.role,
        author: existingMsg.author,
        timestamp: existingMsg.timestamp || new Date()
      });
    }

    // Broadcast AI Stream Start Event to all users in room
    io.to(roomId).emit('ai_stream_start', {
      messageId,
      roomId,
      prompt,
      role: activeRole,
      author,
      version,
      versions: versionsArray,
      timestamp,
      isStreaming: true
    });

    // Reset current room draft prompt back to empty
    if (getIsConnected()) {
      await Room.updateOne({ roomId }, { currentDraftPrompt: '' }).catch(() => {});
    } else {
      const room = memoryStore.rooms.get(roomId);
      if (room) room.currentDraftPrompt = '';
    }
    io.to(roomId).emit('prompt_updated', { prompt: '', editor: null });

    let fullAccumulatedResponse = '';

    // Invoke AI Token Streamer
    await streamAIResponse({
      prompt,
      role: activeRole,
      history: conversationHistory,
      onChunk: (chunkToken) => {
        fullAccumulatedResponse += chunkToken;
        // Broadcast token-by-token update to all room participants
        io.to(roomId).emit('ai_stream_chunk', {
          messageId,
          chunk: chunkToken,
          accumulated: fullAccumulatedResponse
        });
      },
      onEnd: async (finalResponseText) => {
        const finalMessageObj = {
          messageId,
          roomId,
          prompt,
          response: finalResponseText,
          role: activeRole,
          author,
          version,
          versions: versionsArray,
          votes: existingMsg?.votes || { upvotes: [], downvotes: [] },
          isStreaming: false,
          timestamp: new Date()
        };

        // Persist completed message to MongoDB or In-Memory
        if (getIsConnected()) {
          try {
            await Message.findOneAndUpdate(
              { messageId },
              finalMessageObj,
              { upsert: true, new: true }
            );
          } catch (err) {
            console.error('[Save Message DB Error]', err.message);
          }
        } else {
          let roomMsgs = memoryStore.messages.get(roomId);
          if (!roomMsgs) {
            roomMsgs = [];
            memoryStore.messages.set(roomId, roomMsgs);
          }
          const index = roomMsgs.findIndex(m => m.messageId === messageId);
          if (index !== -1) {
            roomMsgs[index] = finalMessageObj;
          } else {
            roomMsgs.push(finalMessageObj);
          }
        }

        // Broadcast AI Stream End Event with full message
        io.to(roomId).emit('ai_stream_end', {
          messageId,
          message: finalMessageObj
        });
      },
      onError: (err) => {
        console.error('[AI Stream Error Handler]', err);
        io.to(roomId).emit('ai_stream_error', {
          messageId,
          error: 'Failed to generate AI response. Please try again.'
        });
      }
    });
  });
};

module.exports = registerChatHandlers;
