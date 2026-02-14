import { Agent } from '@mariozechner/pi-agent-core';
import { registerBuiltInApiProviders, getModel } from '@mariozechner/pi-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { tools } from './tools.js';
import { LEDGER_SYSTEM_PROMPT } from './prompts.js';

dotenv.config({ path: '../.env' });

if (process.env.GEMINI_API_KEY && process.env.GOOGLE_API_KEY) {
    console.log('[LEDGER] Clearing shell GOOGLE_API_KEY so .env GEMINI_API_KEY is used.');
    delete process.env.GOOGLE_API_KEY;
}

registerBuiltInApiProviders();

const apiKey = process.env.GEMINI_API_KEY || '';
const modelConfig = {
    ...getModel('google', 'gemini-2.5-flash'),
    config: { apiKey },
};

async function main() {
    const datasetPath = path.join(process.cwd(), '../agent/golden_dataset.json');
    const resultsPath = path.join(process.cwd(), '../agent/golden_results.json');
    const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8')).slice(0, 1);

    const allResults = [];

    for (const scenario of dataset) {
        const scenarioResults: any = {
            scenario: scenario.scenario,
            turns: []
        };

        const agent = new Agent();
        agent.setModel(modelConfig as any);
        agent.setSystemPrompt(LEDGER_SYSTEM_PROMPT);
        agent.setTools(tools);

        console.log(`\n=== SCENARIO: ${scenario.scenario} ===`);

        for (const turn of scenario.turns) {
            console.log(`\n[USER]: ${turn}`);
            // Wait to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 15000));

            try {
                await agent.prompt(turn);
                const messages = [...agent.state.messages];

                const turnData = {
                    prompt: turn,
                    messages: messages,
                    timestamp: new Date().toISOString()
                };
                scenarioResults.turns.push(turnData);

                // Console logging
                const lastAssistant = messages.filter(m => m.role === 'assistant').pop();
                if (lastAssistant && Array.isArray(lastAssistant.content)) {
                    const text = lastAssistant.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n');
                    console.log(`[AGENT]: ${text.substring(0, 100)}...`);
                }
            } catch (e: any) {
                console.error(`[ERROR]:`, e.message);
                scenarioResults.turns.push({ prompt: turn, error: e.message });
            }
        }
        allResults.push(scenarioResults);
    }

    fs.writeFileSync(resultsPath, JSON.stringify(allResults, null, 2));
    console.log(`\n✅ Results saved to ${resultsPath}`);
}

main().catch(console.error);
