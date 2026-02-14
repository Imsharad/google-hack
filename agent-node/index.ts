import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Agent } from '@mariozechner/pi-agent-core';
import { tools } from './tools.js';
import { LEDGER_SYSTEM_PROMPT } from './prompts.js';
import { registerBuiltInApiProviders, getModel } from '@mariozechner/pi-ai';

dotenv.config({ override: true });

// The Google GenAI SDK prefers GOOGLE_API_KEY over GEMINI_API_KEY.
// We must clear it so our .env's GEMINI_API_KEY is actually used.
if (process.env.GEMINI_API_KEY && process.env.GOOGLE_API_KEY) {
    console.log('[LEDGER] Clearing shell GOOGLE_API_KEY so .env GEMINI_API_KEY is used.');
    delete process.env.GOOGLE_API_KEY;
}

// Register the provider before use
registerBuiltInApiProviders();

const app = express();
const port = process.env.PORT || 8002;

app.use(cors());
app.use(express.json());

// --- Pi Agent Configuration ---

const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    console.error('⚠️  FATAL: GEMINI_API_KEY is missing or still a placeholder!');
    console.error('   Get one at https://aistudio.google.com/apikey');
    console.error('   Then set it in agent-node/.env');
}

// Use pi-ai's model registry for correct cost/context/token config
const model = {
    ...getModel('google', 'gemini-3-pro-preview'),
    config: { apiKey },
};

// --- Helper: extract assistant text from agent messages ---
function extractAssistantText(messages: any[]): { text: string; isError: boolean } {
    // Walk backwards to find the last assistant message
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.role === 'assistant') {
            // Check if the model errored (e.g. 429 quota, auth failure)
            if (msg.stopReason === 'error' && msg.errorMessage) {
                // Parse out the human-readable error
                try {
                    const parsed = JSON.parse(msg.errorMessage);
                    const inner = JSON.parse(parsed?.error?.message || '{}');
                    return {
                        text: `⚠️ Gemini API Error: ${inner?.error?.message || msg.errorMessage}`,
                        isError: true
                    };
                } catch {
                    return { text: `⚠️ Model Error: ${msg.errorMessage}`, isError: true };
                }
            }

            // Normal case: extract text parts
            if (Array.isArray(msg.content)) {
                const textParts = msg.content.filter((p: any) => p.type === 'text' && p.text?.trim());
                if (textParts.length > 0) {
                    return {
                        text: textParts.map((p: any) => p.text).join('\n'),
                        isError: false
                    };
                }
            }
        }
    }
    return { text: '', isError: false };
}

// --- API Endpoints ---

app.get('/', (req, res) => {
    res.json({
        status: 'Pi Agent Core and Ledger are online',
        hasApiKey: !!apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE',
    });
});

/**
 * Chat endpoint: Accepts natural language messages and returns agent responses.
 */
app.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    // Guard: reject early if no valid key
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        return res.status(503).json({
            response: '❌ Ledger is offline — GEMINI_API_KEY not configured. Get one at https://aistudio.google.com/apikey',
            error: 'MISSING_API_KEY'
        });
    }

    try {
        console.log(`[LEDGER] Received: ${message}`);

        // Create a fresh agent per request to avoid stale state
        const agent = new Agent();
        agent.setModel(model);
        agent.setSystemPrompt(LEDGER_SYSTEM_PROMPT);
        agent.setTools(tools);

        // Inject history if provided (ENABLES CONTEXT AWARENESS)
        if (req.body.history && Array.isArray(req.body.history)) {
            console.log(`[LEDGER] Hydrating history with ${req.body.history.length} messages`);

            // Normalize content to array format required by pi-agent/gemini
            agent.state.messages = req.body.history.map((msg: any) => ({
                ...msg,
                content: Array.isArray(msg.content)
                    ? msg.content
                    : [{ type: 'text', text: String(msg.content) }]
            }));
        }

        // Run the agent turn
        await agent.prompt(message);

        const messages = agent.state.messages;

        console.log(`[LEDGER] Turn complete. ${messages.length} messages in state.`);
        // Log message roles for debugging
        messages.forEach((m: any, i: number) => {
            const preview = Array.isArray(m.content)
                ? m.content.map((c: any) => `${c.type}${c.text ? ':' + c.text.substring(0, 60) : ''}`).join(', ')
                : String(m.content).substring(0, 80);
            console.log(`  [${i}] role=${m.role} → ${preview}`);
        });

        const { text: responseText, isError } = extractAssistantText(messages);

        if (!responseText) {
            console.warn('[LEDGER] ⚠️  No text in any assistant message. Dumping full state:');
            console.warn(JSON.stringify(messages, null, 2));
            return res.json({
                response: "I ran my analysis tools but the model didn't generate a text response. Check the agent-node terminal for debug output.",
                turns: messages.length,
                debug: true,
            });
        }

        return res.json({
            response: responseText,
            turns: messages.length,
            ...(isError && { error: true }),
        });

    } catch (error: any) {
        console.error('[LEDGER] Agent Turn Error:', error?.message || error);
        // Surface the real error to the frontend
        return res.status(500).json({
            response: `Agent error: ${error?.message || 'Unknown error'}. Check the agent-node terminal.`,
            error: error?.message,
        });
    }
});


// --- WebSocket Support ---
import { WebSocketServer, WebSocket } from 'ws';

const server = app.listen(port, () => {
    console.log(`🚀 Ledger Pi Agent running on http://localhost:${port}`);
    console.log(`   Model: ${model.name}`);
    console.log(`   API Key: ${apiKey ? apiKey.substring(0, 8) + '...' : '❌ MISSING'}`);
    console.log(`   WebSocket enabled on ws://localhost:${port}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
    console.log('[LEDGER] WS Client connected');

    ws.on('message', async (data: string) => {
        try {
            const payload = JSON.parse(data.toString());
            const { message, history } = payload;

            if (!message) {
                ws.send(JSON.stringify({ type: 'error', error: 'Message is required' }));
                return;
            }

            console.log(`[LEDGER] WS Received: ${message}`);

            // Create agent for this turn
            const agent = new Agent();
            agent.setModel(model);
            agent.setSystemPrompt(LEDGER_SYSTEM_PROMPT);
            agent.setTools(tools);

            // Hydrate history
            if (history && Array.isArray(history)) {
                agent.state.messages = history.map((msg: any) => ({
                    ...msg,
                    content: Array.isArray(msg.content)
                        ? msg.content
                        : [{ type: 'text', text: String(msg.content) }]
                }));
            }

            // Subscribe to events for streaming
            agent.subscribe((event) => {
                // Forward all agent events to client
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'agent_event', data: event }));
                }
            });

            // Run prompt
            await agent.prompt(message);

            // Extract final text
            const { text, isError } = extractAssistantText(agent.state.messages);

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'final_response',
                    data: {
                        response: text,
                        turns: agent.state.messages.length,
                        error: isError
                    }
                }));
            }

        } catch (err: any) {
            console.error('[LEDGER] WS Error:', err);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'error', error: err.message }));
            }
        }
    });

    ws.on('close', () => console.log('[LEDGER] WS Client disconnected'));
});

