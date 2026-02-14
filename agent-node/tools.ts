import { Type } from '@sinclair/typebox';
import type { AgentTool } from '@mariozechner/pi-agent-core';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

// --- Helpers ---

/** Strip internal DB fields that waste agent context */
function stripInternalFields(obj: any): any {
    if (Array.isArray(obj)) return obj.map(stripInternalFields);
    if (obj && typeof obj === 'object') {
        const { id, provider_transaction_id, account_id, raw_payload, pending, ...clean } = obj;
        return clean;
    }
    return obj;
}

/** Project a transaction to concise fields only */
function toConcise(tx: any): any {
    return {
        date: tx.date,
        merchant: tx.merchant_name || tx.name,
        amount: tx.amount,
        category: tx.category_primary || 'Uncategorized',
    };
}

/** Build a truncation notice if results were capped */
function truncationNotice(returned: number, limit: number): string {
    if (returned >= limit) {
        return `\n\n⚠️ Results capped at ${limit}. To see more, narrow your date range or add filters, or increase the limit parameter.`;
    }
    return '';
}

/** Build an actionable error message */
function actionableError(toolName: string, error: any): string {
    const status = error.response?.status;
    const detail = error.response?.data?.detail || error.message;

    if (status === 404 || status === 422) {
        return `Tool "${toolName}" error: No data found or invalid parameters. Check date format (YYYY-MM-DD) and filter values. Detail: ${detail}`;
    }
    if (status === 500) {
        return `Tool "${toolName}" error: Backend returned a server error. The user may need to reconnect their bank. Detail: ${detail}`;
    }
    if (error.code === 'ECONNREFUSED') {
        return `Tool "${toolName}" error: Backend is not running on ${BACKEND_URL}. Ask the user to start the backend server.`;
    }
    return `Tool "${toolName}" error: ${detail}. Try again or use a different tool.`;
}

// --- Tools ---

export const queryTransactionsTool: AgentTool = {
    name: 'ledger_transactions_search',
    label: 'Search Transactions',
    description: `Search the user's bank transaction history with filters. Returns: date, merchant, amount, category for each transaction.

USE THIS TOOL when the user asks about specific spending, purchases, or merchants. Always apply at least one filter to keep results focused:
- By merchant name (fuzzy match): "How much at Starbucks?"
- By category: "Food and Drink", "Transportation", "Entertainment", "Shopping", "Groceries", "Income"
- By date range (YYYY-MM-DD): "last week", "this month"
- By amount range: "purchases over $50"

Default limit is 25. If results are truncated, narrow the date range or add more filters.
Set response_format to "detailed" only if you need transaction IDs for follow-up operations.`,
    parameters: Type.Object({
        merchant: Type.Optional(Type.String({ description: 'Filter by merchant name (fuzzy match, e.g. "Starbucks", "Uber")' })),
        category: Type.Optional(Type.String({ description: 'Filter by primary category. Known values: "Food and Drink", "Transportation", "Entertainment", "Shopping", "Groceries", "Income", "Recreation"' })),
        start_date: Type.Optional(Type.String({ description: 'Start of date range, ISO format YYYY-MM-DD (e.g. "2026-01-01")' })),
        end_date: Type.Optional(Type.String({ description: 'End of date range, ISO format YYYY-MM-DD (e.g. "2026-01-31")' })),
        min_amount: Type.Optional(Type.Number({ description: 'Minimum transaction amount (e.g. 50)' })),
        max_amount: Type.Optional(Type.Number({ description: 'Maximum transaction amount (e.g. 200)' })),
        limit: Type.Optional(Type.Number({ description: 'Max results to return. Default: 25. Use smaller values for targeted lookups.' })),
        response_format: Type.Optional(Type.String({ description: '"concise" (default): date, merchant, amount, category only. "detailed": all fields including internal IDs.' })),
    }),
    execute: async (toolCallId, args: any) => {
        try {
            const params = new URLSearchParams();
            if (args.merchant) params.append('merchant', args.merchant);
            if (args.category) params.append('category', args.category);
            if (args.start_date) params.append('start_date', args.start_date);
            if (args.end_date) params.append('end_date', args.end_date);
            if (args.min_amount) params.append('min_amount', String(args.min_amount));
            if (args.max_amount) params.append('max_amount', String(args.max_amount));

            const limit = args.limit || 25;
            params.append('limit', String(limit));

            const response = await axios.get(`${BACKEND_URL}/transactions`, { params });
            const raw = response.data;

            const format = args.response_format || 'concise';
            const data = format === 'detailed' ? stripInternalFields(raw) : raw.map(toConcise);

            const notice = truncationNotice(data.length, limit);
            const summary = `Found ${data.length} transaction(s).${notice}`;

            return {
                content: [{
                    type: 'text',
                    text: `${summary}\n\n${JSON.stringify(data)}`
                }],
                details: { count: data.length, transactions: data }
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: actionableError('ledger_transactions_search', error) }],
                details: { error: error.message }
            };
        }
    }
};

export const getSubscriptionsTool: AgentTool = {
    name: 'ledger_subscriptions_detect',
    label: 'Detect Subscriptions',
    description: `Identify recurring payments and subscriptions from the user's transaction history. Returns a list of detected subscriptions with: merchant name, estimated monthly cost, frequency, and confidence level.

USE THIS TOOL when the user asks about: "subscriptions", "recurring charges", "monthly bills", "what am I paying for every month?", "cancel suggestions".

This tool analyzes ALL transactions automatically — no filters needed.`,
    parameters: Type.Object({}),
    execute: async (toolCallId) => {
        try {
            const response = await axios.get(`${BACKEND_URL}/subscriptions`);
            const data = stripInternalFields(response.data);
            const count = Array.isArray(data) ? data.length : (data.subscriptions?.length || 0);
            return {
                content: [{
                    type: 'text',
                    text: `Detected ${count} recurring subscription(s).\n\n${JSON.stringify(data)}`
                }],
                details: data
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: actionableError('ledger_subscriptions_detect', error) }],
                details: { error: error.message }
            };
        }
    }
};

export const getAnomaliesTool: AgentTool = {
    name: 'ledger_anomalies_detect',
    label: 'Detect Anomalies',
    description: `Detect unusual spending patterns, outliers, and spikes in the user's transactions. Returns flagged transactions with: merchant, amount, date, and why it was flagged (e.g. "3x above category average").

USE THIS TOOL when the user asks about: "unusual charges", "weird spending", "spikes", "something looks off", "fraud check", "why is my spending high?".

This tool analyzes ALL transactions automatically — no filters needed.`,
    parameters: Type.Object({}),
    execute: async (toolCallId) => {
        try {
            const response = await axios.get(`${BACKEND_URL}/anomalies`);
            const data = stripInternalFields(response.data);
            const count = Array.isArray(data) ? data.length : (data.anomalies?.length || 0);
            return {
                content: [{
                    type: 'text',
                    text: `Found ${count} spending anomaly/anomalies.\n\n${JSON.stringify(data)}`
                }],
                details: data
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: actionableError('ledger_anomalies_detect', error) }],
                details: { error: error.message }
            };
        }
    }
};

export const getForecastTool: AgentTool = {
    name: 'ledger_cashflow_forecast',
    label: 'Forecast Cashflow',
    description: `Project the user's cashflow (income minus spending) for the next N days based on historical patterns. Returns: projected daily spend, projected income, net cashflow, and a trend assessment ("on track" / "at risk").

USE THIS TOOL when the user asks about: "forecast", "projection", "will I run out of money?", "next month", "how much will I spend?", "budget outlook".

Default forecast window is 30 days. Use the 'days' parameter to adjust.`,
    parameters: Type.Object({
        days: Type.Optional(Type.Number({ description: 'Number of days to forecast. Default: 30. Range: 7–90.' }))
    }),
    execute: async (toolCallId, args: any) => {
        const { days = 30 } = args || {};
        try {
            const response = await axios.get(`${BACKEND_URL}/forecast`, { params: { days } });
            const data = stripInternalFields(response.data);
            return {
                content: [{
                    type: 'text',
                    text: `${days}-day cashflow forecast:\n\n${JSON.stringify(data)}`
                }],
                details: data
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: actionableError('ledger_cashflow_forecast', error) }],
                details: { error: error.message }
            };
        }
    }
};

export const checkVelocityTool: AgentTool = {
    name: 'ledger_spending_velocity',
    label: 'Check Spending Velocity',
    description: `Check the user's current spending velocity (burn rate) compared to their historical averages. Returns: current daily burn rate, historical average, percentage difference, and a risk assessment.

USE THIS TOOL when the user asks about: "burn rate", "spending speed", "am I spending too fast?", "pacing", "velocity", "how's my spending compared to normal?".

This tool analyzes ALL transactions automatically — no filters needed.`,
    parameters: Type.Object({}),
    execute: async (toolCallId) => {
        try {
            const response = await axios.get(`${BACKEND_URL}/spending-velocity`);
            const data = stripInternalFields(response.data);
            return {
                content: [{
                    type: 'text',
                    text: `Spending velocity report:\n\n${JSON.stringify(data)}`
                }],
                details: data
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: actionableError('ledger_spending_velocity', error) }],
                details: { error: error.message }
            };
        }
    }
};

export const syncBankDataTool: AgentTool = {
    name: 'ledger_bank_sync',
    label: 'Sync Bank Data',
    description: `Trigger a manual re-sync with the user's connected bank to pull the latest transactions. Use ONLY when the user explicitly asks to refresh or sync their bank data, or when transaction data seems stale.

NOTE: In sandbox mode, this returns a placeholder response. The actual sync happens during bank connection (Plaid Link).

DO NOT call this tool preemptively. The user's data is already synced on bank connection.`,
    parameters: Type.Object({}),
    execute: async (toolCallId) => {
        try {
            const response = await axios.post(`${BACKEND_URL}/sync`);
            const data = response.data;
            return {
                content: [{
                    type: 'text',
                    text: `Bank sync result: ${JSON.stringify(data)}`
                }],
                details: data
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: actionableError('ledger_bank_sync', error) }],
                details: { error: error.message }
            };
        }
    }
};

export const getFinancialSnapshotTool: AgentTool = {
    name: 'ledger_financial_snapshot',
    label: 'Financial Health Snapshot',
    description: `Get a complete financial health snapshot in a single call. Combines: spending velocity, active subscriptions, detected anomalies, and a 30-day cashflow forecast.

USE THIS TOOL when the user asks broad questions like: "how am I doing?", "financial health check", "give me the full picture", "summary of my finances", "overall status".

This tool calls 4 backend endpoints in parallel for speed. Prefer this over calling velocity + subscriptions + anomalies + forecast individually.`,
    parameters: Type.Object({}),
    execute: async (toolCallId) => {
        try {
            const [velocityRes, subscriptionsRes, anomaliesRes, forecastRes] = await Promise.all([
                axios.get(`${BACKEND_URL}/spending-velocity`).catch(e => ({ data: { error: e.message } })),
                axios.get(`${BACKEND_URL}/subscriptions`).catch(e => ({ data: { error: e.message } })),
                axios.get(`${BACKEND_URL}/anomalies`).catch(e => ({ data: { error: e.message } })),
                axios.get(`${BACKEND_URL}/forecast`, { params: { days: 30 } }).catch(e => ({ data: { error: e.message } })),
            ]);

            const snapshot = {
                spending_velocity: stripInternalFields(velocityRes.data),
                subscriptions: stripInternalFields(subscriptionsRes.data),
                anomalies: stripInternalFields(anomaliesRes.data),
                forecast_30d: stripInternalFields(forecastRes.data),
            };

            return {
                content: [{
                    type: 'text',
                    text: `Financial health snapshot:\n\n${JSON.stringify(snapshot)}`
                }],
                details: snapshot
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: actionableError('ledger_financial_snapshot', error) }],
                details: { error: error.message }
            };
        }
    }
};

export const tools = [
    queryTransactionsTool,
    getSubscriptionsTool,
    getAnomaliesTool,
    getForecastTool,
    checkVelocityTool,
    syncBankDataTool,
    getFinancialSnapshotTool,
];
