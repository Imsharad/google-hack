import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Loader2, Sparkles, User } from 'lucide-react';
import { chatWithLedger } from '../services/geminiService';
import { Transaction } from '../types';

interface LedgerAgentProps {
    transactions: Transaction[];
}

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

const LedgerAgent: React.FC<LedgerAgentProps> = ({ transactions }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'init',
            role: 'model',
            text: "Hi, I'm Ledger. I've analyzed your 90-day transaction history. I see a few areas we could optimize. What would you like to know?"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        const responseText = await chatWithLedger(
            messages.map(m => ({ role: m.role, text: m.text })),
            input
        );

        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText || "I encountered an error processing that request."
        }]);
        setLoading(false);
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-2xl overflow-hidden border border-airbnb-line shadow-card">
            {/* Header */}
            <div className="p-6 border-b border-airbnb-line bg-white flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-airbnb-red flex items-center justify-center relative shadow-sm">
                        <Bot className="text-white w-6 h-6" strokeWidth={2.5} />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-airbnb-black">Ledger Assistant</h2>
                        <p className="text-sm text-airbnb-gray">Always active • Financial Analyst</p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50" ref={scrollRef}>
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                                msg.role === 'user' ? 'bg-airbnb-black ml-3' : 'bg-airbnb-red mr-3'
                            }`}>
                                {msg.role === 'user' ? <User size={14} className="text-white"/> : <Bot size={14} className="text-white"/>}
                            </div>
                            
                            {/* Bubble */}
                            <div className={`px-5 py-3 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
                                msg.role === 'user' 
                                    ? 'bg-white text-airbnb-black rounded-tr-sm border border-airbnb-line' 
                                    : 'bg-white text-airbnb-black rounded-tl-sm border border-airbnb-line'
                            }`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                         <div className="flex max-w-[80%] flex-row">
                             <div className="w-8 h-8 rounded-full bg-airbnb-red flex items-center justify-center shrink-0 mt-1 mr-3">
                                 <Bot size={14} className="text-white"/>
                             </div>
                             <div className="px-5 py-3 rounded-2xl rounded-tl-sm bg-white border border-airbnb-line shadow-sm flex items-center space-x-2">
                                <Loader2 className="animate-spin text-airbnb-gray w-4 h-4" />
                                <span className="text-sm text-airbnb-gray">Thinking...</span>
                            </div>
                         </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-airbnb-line">
                <div className="relative flex items-center max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Message Ledger..."
                        className="w-full bg-airbnb-light border border-airbnb-line rounded-full py-3.5 pl-6 pr-14 text-airbnb-black placeholder-airbnb-gray focus:outline-none focus:ring-2 focus:ring-airbnb-black focus:border-transparent transition-all shadow-inner"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="absolute right-2 p-2 bg-airbnb-red text-white rounded-full hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        <Send size={18} fill="currentColor" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LedgerAgent;