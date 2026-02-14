import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Loader2, User } from 'lucide-react';
import { AgentConnection } from '../services/agentService';
import MarkdownMessage from './MarkdownMessage';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const WS_URL = process.env.WS_URL || 'ws://localhost:8002';

const LedgerAgent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'model',
      text: "Hi, I'm Ledger. I'm connected to your real transaction data. Ask me anything — spending patterns, subscriptions, anomalies, or forecasts."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thought, setThought] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const agentRef = useRef<AgentConnection | null>(null);

  useEffect(() => {
    const agent = new AgentConnection(
      WS_URL,
      (data) => {
        switch (data.type) {
          case 'agent_event':
            if (data.thought) setThought(data.thought);
            break;
          case 'final_response':
            setMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              role: 'model',
              text: data.text || "I couldn't generate a response."
            }]);
            setLoading(false);
            setThought(null);
            break;
          case 'error':
            setMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              role: 'model',
              text: `Something went wrong — ${data.error}`
            }]);
            setLoading(false);
            setThought(null);
            break;
        }
      },
      setConnected
    );

    agent.connect();
    agentRef.current = agent;

    return () => agent.disconnect();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thought]);

  const handleSend = () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setThought(null);

    agentRef.current?.send(input);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl overflow-hidden border border-airbnb-line shadow-card">
      {/* Header */}
      <div className="px-6 py-5 border-b border-airbnb-line bg-white flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 rounded-full bg-airbnb-red flex items-center justify-center relative shadow-sm">
            <Bot className="text-white w-5 h-5" strokeWidth={2.5} />
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[2.5px] border-white ${connected ? 'bg-emerald-500' : 'bg-stone-300'}`} />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-airbnb-black tracking-tight">Ledger</h2>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-stone-300'}`} />
              <p className="text-[13px] text-airbnb-gray">
                {connected ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 bg-[#FAFAFA]" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2.5`}>
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-airbnb-black' : 'bg-airbnb-red'
              }`}>
                {msg.role === 'user'
                  ? <User size={13} className="text-white" strokeWidth={2.5} />
                  : <Bot size={13} className="text-white" strokeWidth={2.5} />
                }
              </div>

              {/* Bubble */}
              {msg.role === 'user' ? (
                <div className="px-4 py-2.5 rounded-2xl rounded-br-md bg-airbnb-black text-white text-[15px] leading-[1.6]">
                  <p>{msg.text}</p>
                </div>
              ) : (
                <div className="px-5 py-3.5 rounded-2xl rounded-bl-md bg-white text-airbnb-black border border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <MarkdownMessage text={msg.text} />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2.5">
              <div className="w-7 h-7 rounded-full bg-airbnb-red flex items-center justify-center shrink-0">
                <Bot size={13} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="px-5 py-3.5 rounded-2xl rounded-bl-md bg-white border border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce [animation-delay:300ms]" />
                </div>
                {thought && (
                  <span className="text-[13px] text-airbnb-gray">{thought}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-5 py-4 bg-white border-t border-stone-100">
        <div className="relative flex items-center max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={connected ? "Ask Ledger anything..." : "Connecting..."}
            disabled={!connected}
            className="w-full bg-[#F5F5F5] border border-stone-200 rounded-2xl py-3 pl-5 pr-14 text-[15px] text-airbnb-black placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-airbnb-black/10 focus:border-stone-300 transition-all disabled:opacity-40"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || !connected}
            className="absolute right-1.5 w-9 h-9 flex items-center justify-center bg-airbnb-red text-white rounded-xl hover:bg-rose-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            <Send size={16} className="translate-x-[0.5px]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LedgerAgent;
