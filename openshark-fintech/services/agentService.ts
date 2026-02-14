type MessageHandler = (data: {
  type: 'agent_event' | 'final_response' | 'error';
  text?: string;
  thought?: string;
  error?: string;
  turns?: number;
}) => void;

// Map tool names to user-friendly thinking messages
const TOOL_LABELS: Record<string, string> = {
  query_transactions: 'Checking transactions...',
  get_balance: 'Looking up balance...',
  detect_subscriptions: 'Scanning subscriptions...',
  detect_anomalies: 'Analyzing anomalies...',
  forecast_cashflow: 'Forecasting cashflow...',
  get_spending_velocity: 'Computing spending rate...',
};

export class AgentConnection {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessage: MessageHandler;
  private onStatusChange: (connected: boolean) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  // Accumulate raw agent messages to send as history on next turn
  private rawHistory: any[] = [];

  constructor(
    url: string,
    onMessage: MessageHandler,
    onStatusChange: (connected: boolean) => void
  ) {
    this.url = url;
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.onStatusChange(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch {
          // ignore parse errors
        }
      };

      this.ws.onclose = () => {
        this.onStatusChange(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        // onclose will fire after this
      };
    } catch {
      this.onStatusChange(false);
      this.scheduleReconnect();
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectAttempts = this.maxReconnectAttempts; // prevent reconnect
    this.ws?.close();
    this.ws = null;
  }

  send(message: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.onMessage({ type: 'error', error: 'Not connected to agent' });
      return;
    }
    this.ws.send(JSON.stringify({ message, history: this.rawHistory }));
  }

  private handleMessage(msg: any) {
    switch (msg.type) {
      case 'agent_event': {
        const event = msg.data;
        // Detect tool execution for thinking indicators
        if (event?.type === 'tool_execution_start') {
          const toolName = event?.tool?.name || '';
          const thought = TOOL_LABELS[toolName] || `Running ${toolName}...`;
          this.onMessage({ type: 'agent_event', thought });
        }
        break;
      }
      case 'final_response': {
        const { response, turns, error } = msg.data || {};
        // Store the final messages for history on next turn
        // We track turns so we can rebuild context if needed
        this.rawHistory.push(
          { role: 'user', content: [{ type: 'text', text: '' }] }, // placeholder, real msg was already sent
          { role: 'assistant', content: [{ type: 'text', text: response || '' }] }
        );
        this.onMessage({
          type: 'final_response',
          text: response || '',
          turns,
          ...(error && { error: 'Agent returned an error' }),
        });
        break;
      }
      case 'error':
        this.onMessage({ type: 'error', error: msg.error || 'Unknown error' });
        break;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }
}
