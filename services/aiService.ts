
import { GoogleGenAI } from "@google/genai";
import { getSystemInstruction } from "../constants";
import { AppSettings, ChatMessage } from "../types";
import { CHARACTERS } from "../characters";

// Simple token estimation (approx 4 chars per token)
const estimateTokens = (text: string) => Math.ceil(text.length / 4);

export const callAI = async (
  messages: ChatMessage[],
  settings: AppSettings,
  userName: string,
  userPersona: string,
  scenario: string
): Promise<string> => {
  // Construct detailed character profiles for the system prompt
  const characterProfiles = Object.values(CHARACTERS)
    .map(c => `[${c.id}] Name: ${c.name}\n${c.description}`)
    .join('\n\n');

  const systemPrompt = getSystemInstruction(userName, userPersona, characterProfiles, scenario);
  
  // Apply context limit truncation
  let relevantMessages = [...messages];
  let currentTokens = estimateTokens(systemPrompt);
  
  // Truncate from the beginning of history if we exceed 80% of context limit 
  // (leaving room for the response and overhead)
  const safetyThreshold = settings.contextLimit * 0.8;
  
  for (let i = messages.length - 1; i >= 0; i--) {
    currentTokens += estimateTokens(messages[i].text);
    if (currentTokens > safetyThreshold) {
      relevantMessages = messages.slice(i + 1);
      break;
    }
  }

  if (settings.useOpenRouter && settings.openRouterKey) {
    const history = relevantMessages.map(m => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.text
    }));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${settings.openRouterKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": settings.openRouterModel || "google/gemini-2.0-flash-exp:free",
        "messages": [
          { "role": "system", "content": systemPrompt },
          ...history
        ]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  } else {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
      },
    });

    let lastResponse = "";
    
    // If no history, we prompt the model to start the scene
    if (relevantMessages.length === 0) {
      const res = await chat.sendMessage({ message: "The scene begins. Please start the interaction based on the permanent scenario and character instructions." });
      return res.text;
    }

    // Replay relevant history to maintain context state in the chat object
    for (let i = 0; i < relevantMessages.length; i++) {
      const m = relevantMessages[i];
      if (m.role === 'user') {
        const res = await chat.sendMessage({ message: m.text });
        lastResponse = res.text;
      }
    }
    
    return lastResponse;
  }
};
