
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  async generateMenuDescription(itemName: string, category: string) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a appetizing, professional one-sentence menu description for a dish called "${itemName}" in the "${category}" category. Keep it under 20 words.`,
      });
      return response.text?.trim() || "A delicious addition to our menu.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Freshly prepared with the finest ingredients.";
    }
  },

  async getStaffAssistant(query: string, currentOrders: any[]) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `As a restaurant management assistant, answer this query: "${query}". 
        Context: There are currently ${currentOrders.length} active orders in the system.`,
      });
      return response.text;
    } catch (error) {
      return "I'm sorry, I'm having trouble connecting to the brain right now.";
    }
  }
};
