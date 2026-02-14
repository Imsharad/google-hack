import { Agent } from '@mariozechner/pi-agent-core';
import { registerBuiltInApiProviders } from '@mariozechner/pi-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

registerBuiltInApiProviders();

async function test() {
    const agent = new Agent();
    agent.setModel({
        api: 'google-generative-ai',
        provider: 'google',
        name: 'gemini-1.5-flash',
        config: {
            apiKey: process.env.GEMINI_API_KEY || '',
        }
    } as any);

    console.log("Starting prompt...");
    try {
        await agent.prompt("Hello");
        console.log("Response:", JSON.stringify(agent.state.messages, null, 2));
    } catch (e: any) {
        console.error("Caught Error:", e);
    }
}

test();
