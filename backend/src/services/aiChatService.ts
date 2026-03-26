import User from '../models/User';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import mongoose from 'mongoose';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
// import { io } from '../server'; // Removed to avoid circular dependency

const AI_ASSISTANT_EMAIL = 'ai-assistant@campus-chat.com';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const AI_SYSTEM_PROMPT = `
You are the "AI Study Assistant" for Vantage, a campus social and academic platform.
Your goal is to help students with their studies, campus life, and platform navigation.

Tone: Friendly, helpful, intelligent, and encouraging.
Context: You are talking to a student.
Constraints: Keep responses concise but comprehensive. Use markdown for better readability.
`;

/**
 * Ensures the system AI Assistant user exists in the database.
 */
export async function ensureAIUser() {
  let aiUser = await User.findOne({ email: AI_ASSISTANT_EMAIL });
  
  if (!aiUser) {
    aiUser = await User.create({
      name: 'AI Study Assistant',
      email: AI_ASSISTANT_EMAIL,
      student_id: 'SYSTEM_AI_ASSISTANT',
      password_hash: 'system-protected-password-' + Math.random(),
      role: 'admin',
      profile_picture: 'https://ui-avatars.com/api/?name=AI+Assistant&background=f5eeff&color=6d28d9',
      status: 'online'
    });
    console.log('[AI Chat Service] Created System AI Assistant user');
  }
  
  return aiUser;
}

/**
 * Finds or creates a conversation between a user and the AI Assistant.
 */
export async function getAIConversation(userId: string) {
  const aiUser = await ensureAIUser();
  
  let conversation = await Conversation.findOne({
    participants: { $all: [userId, aiUser._id] }
  }).populate('participants', 'name email profile_picture status last_seen');
  
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, aiUser._id],
      last_message_time: new Date()
    });
    
    // Create initial greeting
    const greeting = await Message.create({
      conversation_id: conversation._id,
      sender_id: aiUser._id,
      recipient_id: userId,
      receiver: userId,
      message_text: "Hello! I'm your AI Study Assistant. How can I help you today? ✨",
      message_type: 'text',
      read: false
    });

    conversation.last_message = greeting._id as any;
    await conversation.save();
    
    await conversation.populate('participants', 'name email profile_picture status last_seen');
  }
  
  return conversation;
}

async function fetchAIResponse(userMessage: string, history: any[], aiUserId: string) {
    console.log(`[AI Service] fetchAIResponse called for userMessage: "${userMessage.substring(0, 20)}..."`);
    // Helper: compare sender_id (ObjectId) to the AI user's real _id
    const isAISender = (m: any) => m.sender_id.toString() === aiUserId;

    // 1. Try OpenRouter (User Requested) - Primary
    if (process.env.OPENROUTER_API_KEY) {
        try {
            console.log('[AI Service] Attempting OpenRouter...');
            
            // Normalize history: Filter out errors and ensure role alternation
            const messages: any[] = [{ role: "system", content: AI_SYSTEM_PROMPT }];
            let lastRole: string | null = "system";

            for (const m of history) {
                // Skip error messages from history
                if (m.message_text.includes("trouble connecting to my brain")) continue;

                const role = isAISender(m) ? "assistant" : "user";
                if (role !== lastRole) {
                    messages.push({ role, content: m.message_text });
                    lastRole = role;
                } else {
                    // Merge same-role messages
                    messages[messages.length - 1].content += "\n" + m.message_text;
                }
            }

            // Finally add user message
            if (lastRole === "user") {
                messages[messages.length - 1].content += "\n" + userMessage;
            } else {
                messages.push({ role: "user", content: userMessage });
            }

            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: "google/gemini-2.0-flash-exp:free", // High speed, low latency
                messages,
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://campus-chat.com',
                    'X-Title': 'Campus Chat Assistant'
                },
                timeout: 10000 // 10 second timeout
            });
            
            if (response.data?.choices?.[0]?.message?.content) {
                return response.data.choices[0].message.content;
            }
        } catch (err: any) {
            const errorDetails = {
                message: err.message,
                data: err.response?.data,
                status: err.response?.status
            };
            console.error('[AI Service] OpenRouter Error DETAILS:', errorDetails);
            
            // Log to dedicated file for persistent debugging
            const logPath = path.resolve(__dirname, '../../error_diagnostics.log');
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] [AI_OPENROUTER_ERROR] ${JSON.stringify(errorDetails)}\n`);
        }
    }

    // 2. Try OpenAI (Secondary)
    if (process.env.OPENAI_API_KEY) {
        try {
            console.log('[AI Service] Falling back to OpenAI...');
            
            // Normalize history: Filter out errors and ensure role alternation
            const messages: any[] = [{ role: "system", content: AI_SYSTEM_PROMPT }];
            let lastRole: string | null = "system";

            for (const m of history) {
                // Skip error messages from history
                if (m.message_text.includes("trouble connecting to my brain")) continue;

                const role = isAISender(m) ? "assistant" : "user";
                if (role !== lastRole) {
                    messages.push({ role, content: m.message_text });
                    lastRole = role;
                } else {
                    // Merge same-role messages
                    messages[messages.length - 1].content += "\n" + m.message_text;
                }
            }

            // Finally add user message
            if (lastRole === "user") {
                messages[messages.length - 1].content += "\n" + userMessage;
            } else {
                messages.push({ role: "user", content: userMessage });
            }

            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-4o-mini",
                messages,
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            return response.data.choices[0].message.content;
        } catch (err: any) {
            console.error('[AI Service] OpenAI Error:', err?.response?.data || err?.message);
        }
    }

    // 3. Try DeepSeek (Tertiary)
    if (process.env.DEEPSEEK_API_KEY) {
        try {
            console.log('[AI Service] Falling back to DeepSeek...');
            
            // Normalize history: Filter out errors and ensure role alternation
            const messages: any[] = [{ role: "system", content: AI_SYSTEM_PROMPT }];
            let lastRole: string | null = "system";

            for (const m of history) {
                // Skip error messages from history
                if (m.message_text.includes("trouble connecting to my brain")) continue;

                const role = isAISender(m) ? "assistant" : "user";
                if (role !== lastRole) {
                    messages.push({ role, content: m.message_text });
                    lastRole = role;
                } else {
                    // Merge same-role messages
                    messages[messages.length - 1].content += "\n" + m.message_text;
                }
            }

            // Finally add user message
            if (lastRole === "user") {
                messages[messages.length - 1].content += "\n" + userMessage;
            } else {
                messages.push({ role: "user", content: userMessage });
            }

            const response = await axios.post('https://api.deepseek.com/chat/completions', {
                model: "deepseek-chat",
                messages,
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            return response.data.choices[0].message.content;
        } catch (err: any) {
            console.error('[AI Service] DeepSeek Error:', err?.response?.data || err?.message);
        }
    }

    // 3. Fallback to Gemini
    if (process.env.GEMINI_API_KEY) {
        try {
            console.log('[AI Service] Attempting Gemini fallback...');
            
            const normalizedHistory: any[] = [];
            let lastRole = '';
            
            for (const m of history) {
                const role = isAISender(m) ? "model" : "user";
                if (role !== lastRole) {
                    normalizedHistory.push({
                        role: role,
                        parts: [{ text: m.message_text }]
                    });
                    lastRole = role;
                }
            }

            // Gemini strictly requires the first message in history to be from "user".
            // If the first message is the AI's greeting ("model"), we must remove it.
            if (normalizedHistory.length > 0 && normalizedHistory[0].role === 'model') {
                normalizedHistory.shift();
            }

            // History must end with "model" before sending a new "user" message
            if (normalizedHistory.length > 0 && normalizedHistory[normalizedHistory.length - 1].role === 'user') {
                normalizedHistory.pop();
            }

            const chat = geminiModel.startChat({ history: normalizedHistory });
            const result = await chat.sendMessage(userMessage);
            const response = await result.response;
            return response.text();
        } catch (err: any) {
            console.error('[AI Service] Gemini Error:', err?.message);
            if (err?.response) console.error('[AI Service] Gemini Response Data:', err.response.data);
        }
    }

    // Final fallback
    console.warn('[AI Service] ALL AI providers failed. Check API keys and limits.');
    return "I'm currently having some trouble connecting to my brain. Please try again in a moment!";
}

/**
 * Handles generating and saving an AI response.
 */
export async function handleAIResponse(conversationId: string, userMessage: string, userId: string) {
    console.log(`[AI Chat] Handling AI response for conversation: ${conversationId}`);
    const aiUser = await ensureAIUser();
    
    // Fetch conversation to check cleared_history
    const conversation = await Conversation.findById(conversationId);
    let filterQuery: any = { conversation_id: conversationId };
    
    if (conversation) {
        const clearRecord = (conversation as any).cleared_history?.find(
            (h: any) => h.userId.toString() === userId.toString()
        );
        if (clearRecord && clearRecord.clearedAt) {
            filterQuery.timestamp = { $gte: clearRecord.clearedAt };
        }
    }

    // Fetch recent history
    const history = await Message.find(filterQuery)
        .sort({ timestamp: -1 })
        .limit(10);
    
    console.log(`[AI Chat] Fetched ${history.length} messages for context`);
    
    const aiText = await fetchAIResponse(userMessage, history.reverse(), aiUser._id.toString());
    console.log(`[AI Chat] AI generated response: ${aiText.substring(0, 50)}...`);

    const message = await Message.create({
        conversation_id: conversationId,
        sender_id: aiUser._id,
        recipient_id: userId,
        receiver: userId,
        message_text: aiText,
        message_type: 'text',
        read: false
    });

    await Conversation.findByIdAndUpdate(conversationId, {
        last_message: message._id,
        last_message_time: new Date()
    });

    // Populate for Socket
    await message.populate('sender_id', 'name profile_picture');

    // Emit to room
    const { io } = require('../server'); // Late import to avoid circular dependency
    if (io) {
        console.log(`[AI Chat] Emitting receive_message to room: ${conversationId}`);
        io.to(conversationId.toString()).emit('receive_message', message);
    } else {
        console.warn('[AI Chat] Socket.io (io) not found, could not emit message');
    }

    return message;
}
