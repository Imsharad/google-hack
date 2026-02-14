import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

// Initialize Gemini Client
// NOTE: In a real production app, calls should go through a backend to protect the API Key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const LEDGER_SYSTEM_INSTRUCTION = `
You are 'Ledger', an autonomous financial forensic analyst for the OpenShark platform.
Your persona is dry, professional, highly analytical, and action-oriented. You do not fluff words.
You analyze raw transaction data to find "leaks" in cash flow, identify spending DNA, and flag anomalies.
You speak directly to the user.
`;

export const analyzeTransactions = async (transactions: Transaction[]) => {
  if (!process.env.API_KEY) {
    return "API Key missing. Cannot generate AI insights. Please ensure specific API key is set.";
  }

  // Summarize data for the prompt to save tokens
  const recentTxns = transactions.slice(0, 20).map(t => 
    `${t.date}: ${t.merchant} (${t.amount > 0 ? '+' : ''}$${Math.abs(t.amount).toFixed(2)})`
  ).join('\n');

  const income = transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + t.amount, 0);

  const prompt = `
    Analyze the following financial snapshot:
    Total Income (90 days): $${income.toFixed(2)}
    Total Expense (90 days): $${Math.abs(expense).toFixed(2)}
    
    Recent Transactions:
    ${recentTxns}

    Provide a "Financial DNA" assessment (max 3 sentences) and 3 bullet points of specific, actionable advice to improve cashflow.
    Identify if there are any concerning patterns.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: LEDGER_SYSTEM_INSTRUCTION,
      }
    });
    return response.text || "Ledger could not analyze the data at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Connection to Ledger Intelligence failed. Please try again later.";
  }
};

export const chatWithLedger = async (history: {role: 'user' | 'model', text: string}[], newMessage: string) => {
    if (!process.env.API_KEY) return "System Offline: API Key Missing.";

    try {
        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: LEDGER_SYSTEM_INSTRUCTION
            },
            history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] }))
        });

        const result = await chat.sendMessage({ message: newMessage });
        return result.text;
    } catch (e) {
        console.error(e);
        return "Ledger is currently unavailable.";
    }
}