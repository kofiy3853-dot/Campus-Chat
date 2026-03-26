import { GoogleGenerativeAI } from "@google/generative-ai";
import cron from 'node-cron';
import axios from 'axios';
import Announcement from '../models/Announcement';
import User from '../models/User';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * MASTER PROMPT — DAILY ANNOUNCEMENT ENGINE
 */
const SYSTEM_PROMPT = `
You are a growth-focused product engine for a campus social platform.
Your job is to generate high-engagement announcements that drive immediate user action inside the app.

Context:
- The app includes chat, marketplace, confessions, events, and student networking.
- Users are students with short attention spans.

Constraints:
- Announcements must be short, clear, and action-driven.
- Output format (STRICT JSON):
{
  "title": "...",
  "message": "...",
  "type": "engagement | marketplace | social",
  "priority": "high",
  "cta": "..."
}
`;

async function generateWithOpenRouter(type: string) {
  if (!process.env.OPENROUTER_API_KEY) return null;
  
  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: "google/gemini-2.0-flash-exp:free",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Generate a ${type} announcement.` }
      ],
      response_format: { type: "json_object" }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://campus-chat.com',
        'X-Title': 'Campus Chat Announcement Engine'
      },
      timeout: 10000
    });
    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('[Announcement Engine] OpenRouter Error:', err);
    return null;
  }
}

async function generateWithOpenAI(type: string) {
  if (!process.env.OPENAI_API_KEY) return null;
  
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Generate a ${type} announcement.` }
      ],
      response_format: { type: "json_object" }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('[Announcement Engine] OpenAI Error:', err);
    return null;
  }
}

async function generateWithDeepSeek(type: string) {
  if (!process.env.DEEPSEEK_API_KEY) return null;
  
  try {
    const response = await axios.post('https://api.deepseek.com/chat/completions', {
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Generate a ${type} announcement.` }
      ],
      response_format: { type: 'json_object' }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek Error:', error);
    return null;
  }
}

async function generateWithGemini(type: string) {
  if (!process.env.GEMINI_API_KEY) return null;

  try {
    const prompt = `Generate a ${type} announcement for a campus app based on the system instructions.`;
    const result = await geminiModel.generateContent([SYSTEM_PROMPT, prompt]);
    const response = await result.response;
    return response.text().replace(/```json|```/g, "").trim();
  } catch (error) {
    console.error('Gemini Error:', error);
    return null;
  }
}

async function generateAIAnnouncement(type: 'engagement' | 'marketplace' | 'social') {
  try {
    console.log(`[Announcement Engine] Generating AI announcement for type: ${type}`);
  
    let rawContent: string | null = null;
  
    // 1. Try OpenRouter (User Requested - Primary)
    rawContent = await generateWithOpenRouter(type);

    // 2. Try OpenAI (Secondary)
    if (!rawContent) {
      console.log(`[Announcement Engine] OpenRouter unavailable, falling back to OpenAI...`);
      rawContent = await generateWithOpenAI(type);
    }

    // 3. Try DeepSeek (Tertiary)
    if (!rawContent) {
      console.log(`[Announcement Engine] OpenAI unavailable, falling back to DeepSeek...`);
      rawContent = await generateWithDeepSeek(type);
    }

    // 4. Try Gemini (Fallback)
    if (!rawContent) {
      console.log(`[Announcement Engine] DeepSeek unavailable, falling back to Gemini...`);
      rawContent = await generateWithGemini(type);
    }
    
    if (rawContent) {
      try {
        return JSON.parse(rawContent);
      } catch (parseError) {
        console.error('[Announcement Engine] JSON Parse Error, using raw content as title:', parseError);
        // If it's not JSON, try to use it as a title at least
        return {
           title: rawContent.substring(0, 50),
           message: rawContent,
           type: type,
           priority: 'high',
           cta: 'View'
        };
      }
    }

    // High-quality fallbacks
    const fallbacks = {
      engagement: {
        title: "🔥 Trending: The Gossip is Hot!",
        message: "Something big just happened near the library. Everyone's talking about it in Confessions.",
        type: "engagement",
        priority: "high",
        cta: "Read Confessions"
      },
      marketplace: {
        title: "💸 Quick Cash Alert!",
        message: "Cleaning out your dorm? Students are looking for textbooks and electronics right now.",
        type: "marketplace",
        priority: "high",
        cta: "Sell Now"
      },
      social: {
        title: "🎓 Tonight's Main Event",
        message: "The weekend prep has started! Check out the top-rated study groups and mixers.",
        type: "social",
        priority: "high",
        cta: "Explore Events"
      }
    };

    return fallbacks[type];
  } catch (error) {
    console.error('AI Strategy Error:', error);
    return null;
  }
}

export async function createDailyAnnouncement(type: 'engagement' | 'marketplace' | 'social') {
  try {
    const data = await generateAIAnnouncement(type);
    if (!data) return;

    // Find an admin user to be the author
    let systemUser = await User.findOne({ email: 'nharnahyhaw19@gmail.com' });
    if (!systemUser) {
        systemUser = await User.findOne({ role: 'admin' });
    }

    if (!systemUser) {
      console.error('No admin user found for automated announcements');
      return;
    }

    const announcement = await Announcement.create({
      title: data.title,
      content: data.message, // Map 'message' to 'content' in our model
      type: data.type,
      priority: data.priority,
      cta: data.cta,
      posted_by: systemUser._id,
      is_auto_generated: true,
      pinned: data.priority === 'high'
    });

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('posted_by', 'name profile_picture');

    // Real-time Distribution (Late import to avoid circular dependency)
    const { io } = require('../server');
    if (io) {
      console.log(`[Announcement Engine] Broadcasting new announcement: ${announcement._id}`);
      io.emit('new_announcement', populatedAnnouncement);
    }

    console.log(`[Announcement Engine] Deployed ${type} announcement: ${data.title}`);
    return populatedAnnouncement;
  } catch (error) {
    console.error('Announcement Engine Error:', error);
  }
}

export function initAnnouncementEngine() {
  console.log('[Announcement Engine] Initializing Scheduler...');

  // Morning (8 AM) → Engagement trigger
  cron.schedule('0 8 * * *', () => {
    console.log('[Announcement Engine] Running Morning Engagement Trigger...');
    createDailyAnnouncement('engagement');
  });

  // Afternoon (1 PM) → Marketplace activation
  cron.schedule('0 13 * * *', () => {
    console.log('[Announcement Engine] Running Afternoon Marketplace Trigger...');
    createDailyAnnouncement('marketplace');
  });

  // Evening (7 PM) → Social/confession interaction
  cron.schedule('0 19 * * *', () => {
    console.log('[Announcement Engine] Running Evening Social Trigger...');
    createDailyAnnouncement('social');
  });

  // Manual trigger for testing if env is development
  if (process.env.NODE_ENV === 'development') {
    // Run one immediately for verification
    // createDailyAnnouncement('engagement');
  }
}
