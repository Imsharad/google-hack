import { Agent } from '@mariozechner/pi-agent-core';
import { getModel, registerBuiltInApiProviders } from '@mariozechner/pi-ai';
import { tools } from './tools.js'; // Import real tools
import dotenv from 'dotenv';

dotenv.config({ override: true });
if (process.env.GEMINI_API_KEY && process.env.GOOGLE_API_KEY) {
    delete process.env.GOOGLE_API_KEY;
}

registerBuiltInApiProviders();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('No API Key');
    process.exit(1);
}

// Use the same model as index.ts
const model = {
    ...getModel('google', 'gemini-2.0-flash-exp'),
    config: { apiKey },
};

const agent = new Agent();
agent.setModel(model);
agent.setTools(tools); // Set tools!

agent.subscribe((event) => {
    console.log('EVENT:', JSON.stringify(event, null, 2));
});

console.log('Starting prompt...');
// Ask something that requires a tool. 
// Assuming tools has 'get_balance' or similar?
await agent.prompt("Check my spending on Netflix."); // Hope this triggers a tool
console.log('Done.');
