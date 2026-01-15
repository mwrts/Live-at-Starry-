
import { GoogleGenAI } from "@google/genai";
import { getSystemInstruction } from "../constants";
import { AppSettings, ChatMessage } from "../types";
import { CHARACTERS } from "../characters";

export const callAI = async (
  messages: ChatMessage[],
  settings: AppSettings,
  userName: string,
  userPersona: string,
  scenario: string
): Promise<string> => {
  const characterNames = Object.values(CHARACTERS).map(c => c.id);
  const systemPrompt = getSystemInstruction(userName, userPersona, characterNames) + `\nSCENARIO: ${scenario}`;
  
  if (settings.useOpenRouter && settings.openRouterKey) {
    const history = messages.map(m => ({
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
    
    // If there are no messages yet, this is the very first trigger.
    if (messages.length === 0) {
      const res = await chat.sendMessage({ message: "The scene begins. Please start the interaction based on the scenario." });
      return res.text;
    }

    // Replay history to build context
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (m.role === 'user') {
        const res = await chat.sendMessage({ message: m.text });
        lastResponse = res.text;
      }
    }
    
    return lastResponse;
  }
};
