const Room = require('../models/Room');
const Message = require('../models/Message');
const { getIsConnected } = require('../config/db');
const { memoryStore } = require('../controllers/roomController');

const registerRoomHandlers = (io, socket) => {

  // Event: edit_prompt (Live Collaborative Prompt Editing - Draft sync)
  socket.on('edit_prompt', async ({ roomId, prompt, editor }) => {
    if (!roomId) return;

    // Save draft in room state
    if (getIsConnected()) {
      try {
        await Room.updateOne({ roomId }, { currentDraftPrompt: prompt });
      } catch (err) {
        console.error('[Room Draft Edit DB Error]', err.message);
      }
    } else {
      const room = memoryStore.rooms.get(roomId);
      if (room) room.currentDraftPrompt = prompt;
    }

    // Broadcast updated live prompt draft to all users in the room
    socket.to(roomId).emit('prompt_updated', {
      prompt,
      editor
    });
  });

  // Event: switch_role (Switch AI Persona dynamically)
  socket.on('switch_role', async ({ roomId, role, user }) => {
    if (!roomId || !role) return;

    if (getIsConnected()) {
      try {
        await Room.updateOne({ roomId }, { activeRole: role });
      } catch (err) {
        console.error('[Switch Role DB Error]', err.message);
      }
    } else {
      const room = memoryStore.rooms.get(roomId);
      if (room) room.activeRole = role;
    }

    // Broadcast persona role update to all clients in room
    io.to(roomId).emit('role_switched', {
      role,
      user
    });
  });

  // Event: vote_prompt (Vote on prompt/response quality)
  socket.on('vote_prompt', async ({ roomId, messageId, voteType, userId }) => {
    if (!roomId || !messageId || !userId) return;

    let updatedMessage = null;

    if (getIsConnected()) {
      try {
        const msg = await Message.findOne({ messageId, roomId });
        if (msg) {
          if (!msg.votes) msg.votes = { upvotes: [], downvotes: [] };
          
          if (voteType === 'up') {
            if (!msg.votes.upvotes.includes(userId)) {
              msg.votes.upvotes.push(userId);
              msg.votes.downvotes = msg.votes.downvotes.filter(id => id !== userId);
            }
          } else if (voteType === 'down') {
            if (!msg.votes.downvotes.includes(userId)) {
              msg.votes.downvotes.push(userId);
              msg.votes.upvotes = msg.votes.upvotes.filter(id => id !== userId);
            }
          }
          await msg.save();
          updatedMessage = msg;
        }
      } catch (err) {
        console.error('[Vote DB Error]', err.message);
      }
    } else {
      const roomMessages = memoryStore.messages.get(roomId) || [];
      const msg = roomMessages.find(m => m.messageId === messageId);
      if (msg) {
        if (!msg.votes) msg.votes = { upvotes: [], downvotes: [] };
        if (voteType === 'up') {
          if (!msg.votes.upvotes.includes(userId)) {
            msg.votes.upvotes.push(userId);
            msg.votes.downvotes = msg.votes.downvotes.filter(id => id !== userId);
          }
        } else if (voteType === 'down') {
          if (!msg.votes.downvotes.includes(userId)) {
            msg.votes.downvotes.push(userId);
            msg.votes.upvotes = msg.votes.upvotes.filter(id => id !== userId);
          }
        }
        updatedMessage = msg;
      }
    }

    if (updatedMessage) {
      io.to(roomId).emit('prompt_voted', {
        messageId,
        votes: updatedMessage.votes
      });
    }
  });
};

module.exports = registerRoomHandlers;
