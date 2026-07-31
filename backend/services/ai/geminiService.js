const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getPersona } = require('./personas');
const User = require('../../models/User');
const Usage = require('../../models/Usage');
const { getIsConnected } = require('../../config/db');
const { v4: uuidv4 } = require('uuid');

let genAI = null;
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (apiKey && apiKey.trim() !== '') {
  genAI = new GoogleGenerativeAI(apiKey.trim());
}

/**
 * Record token usage in database and update user consumption totals
 */
const recordTokenUsage = async ({ userId, roomId, prompt, completionText, role }) => {
  if (!userId || userId.startsWith('guest_')) return;

  // Approximate token counts (4 chars per token average)
  const promptTokens = Math.ceil((prompt || '').length / 4);
  const completionTokens = Math.ceil((completionText || '').length / 4);
  const totalTokens = promptTokens + completionTokens;

  if (getIsConnected()) {
    try {
      // Create Usage audit record
      const usage = new Usage({
        usageId: 'usg_' + uuidv4().substring(0, 8),
        userId,
        roomId,
        promptTokens,
        completionTokens,
        totalTokens,
        role,
        timestamp: new Date()
      });
      await usage.save();

      // Increment total tokensUsed & promptsExecuted on user
      await User.updateOne(
        { id: userId },
        {
          $inc: {
            tokensUsed: totalTokens,
            promptsExecuted: 1
          }
        }
      );
    } catch (err) {
      console.error('[Record Usage Error]', err.message);
    }
  }
};

/**
 * Stream AI response token-by-token using Google Gemini API.
 */
const streamAIResponse = async ({ prompt, role = 'Coder AI', history = [], userId, roomId, onChunk, onEnd, onError }) => {
  const persona = getPersona(role);
  const currentKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (currentKey && currentKey.trim() !== '') {
    try {
      if (!genAI) {
        genAI = new GoogleGenerativeAI(currentKey.trim());
      }

      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: persona.systemPrompt
      });

      const chatHistory = history.map(msg => ([
        { role: 'user', parts: [{ text: msg.prompt }] },
        { role: 'model', parts: [{ text: msg.response || '' }] }
      ])).flat().filter(h => h.parts[0].text && h.parts[0].text.trim() !== '');

      const chat = model.startChat({ history: chatHistory });
      const resultStream = await chat.sendMessageStream(prompt);

      let fullText = '';
      for await (const chunk of resultStream.stream) {
        const token = chunk.text();
        if (token) {
          fullText += token;
          if (onChunk) onChunk(token);
        }
      }

      // Record SaaS token usage
      recordTokenUsage({ userId, roomId, prompt, completionText: fullText, role });

      if (onEnd) onEnd(fullText);
      return;
    } catch (err) {
      console.error('[Google Gemini Stream Error]', err.message);
    }
  }

  // Fallback simulated streaming
  simulateTokenStream({ prompt, role, persona, userId, roomId, onChunk, onEnd });
};

const simulateTokenStream = ({ prompt, role, persona, userId, roomId, onChunk, onEnd }) => {
  const baseResponse = persona.sampleResponses[Math.floor(Math.random() * persona.sampleResponses.length)];
  const responseContent = baseResponse;

  const tokens = responseContent.match(/(\s+|\S+)/g) || [responseContent];
  let fullText = '';
  let index = 0;

  const interval = setInterval(() => {
    if (index < tokens.length) {
      const token = tokens[index];
      fullText += token;
      if (onChunk) onChunk(token);
      index++;
    } else {
      clearInterval(interval);
      recordTokenUsage({ userId, roomId, prompt, completionText: fullText, role });
      if (onEnd) onEnd(fullText);
    }
  }, 40);
};

module.exports = { streamAIResponse };
