
import { GoogleGenAI } from "@google/genai";
import { Order } from "../types";

export const getSalesInsights = async (orders: Order[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const orderSummary = orders.map(o => ({
    status: o.status,
    amount: o.totalAmount,
    date: o.createdAt
  }));

  const prompt = `
    Acting as a Senior Sales Analyst, analyze the following order data for a SaaS platform.
    Provide a concise (max 3 bullet points) summary of:
    1. Overall performance.
    2. Key area of concern (if any).
    3. Actionable advice for the team.

    Data: ${JSON.stringify(orderSummary)}
    
    Format the response as clear markdown bullet points.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Insights unavailable.";
  }
};
