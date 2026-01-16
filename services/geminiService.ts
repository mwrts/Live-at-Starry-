
import { GoogleGenAI } from "@google/genai";
import { getSystemInstruction } from "../constants";
import { CHARACTERS } from "../characters";

// Fixed API key initialization according to guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const startChat = () => {
  // Construct detailed character profiles for the system prompt
  const characterProfiles = Object.values(CHARACTERS)
    .map(c => `[${c.id}] Name: ${c.name}\n${c.description}`)
    .join('\n\n');
  
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      // Fixed: getSystemInstruction requires four arguments: userName, userPersona, characterProfiles, and scenario
      systemInstruction: getSystemInstruction('', '', characterProfiles, ''),
      temperature: 0.8,
    },
  });
};

export const sendMessage = async (chat: any, message: string) => {
  try {
    const response = await chat.sendMessage({ message });
    // Fixed: response.text is a property, not a method
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
