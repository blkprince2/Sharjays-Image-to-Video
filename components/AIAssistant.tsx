import React, { useState, useEffect, useRef } from 'react';
import { gemini } from '../geminiService';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  sources?: { title: string; uri: string }[];
}

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Welcome Director. I am your Studio Co-Pilot. How can I assist with your production today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatSession) {
      gemini.startAssistantChat().then(session => setChatSession(session));
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (override?: string) => {
    const text = override || input;
    if (!text.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsLoading(true);

    try {
      let session = chatSession;
      if (!session) {
        session = await gemini.startAssistantChat();
        setChatSession(session);
      }
      const result = await session.sendMessage({ message: text });
      
      // Extract grounding metadata if available
      const sources = result.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => chunk.web)
        .filter(Boolean);

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: result.text || "I'm processing that...",
        sources
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Signal interference detected. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="glass-effect w-[350px] md:w-[400px] h-[500px] rounded-2xl mb-4 flex flex-col shadow-2xl border border-gold/40 animate-slideUp overflow-hidden">
          <div className="p-4 border-b border-gold/20 flex justify-between items-center bg-gold/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="text-gold font-bold text-xs uppercase tracking-widest">Studio Co-Pilot</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white"><i className="fas fa-times"></i></button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-gold text-black' : 'bg-white/5 border border-white/10'}`}>
                  {m.text}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <p className="text-[10px] text-gold/60 uppercase font-black mb-1">Sources:</p>
                      {m.sources.map((s, idx) => (
                        <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-blue-400 truncate hover:underline mb-0.5">• {s.title || s.uri}</a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && <div className="flex gap-1 p-3"><div className="w-1 h-1 bg-gold rounded-full animate-bounce"></div><div className="w-1 h-1 bg-gold rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-1 h-1 bg-gold rounded-full animate-bounce [animation-delay:0.4s]"></div></div>}
          </div>
          <div className="p-4 bg-black/40 border-t border-gold/20 flex gap-2">
            <input type="text" placeholder="Ask Co-Pilot..." className="flex-1 bg-[#1A1A1A] border border-gold/20 rounded-full py-2 px-4 text-xs text-white focus:outline-none focus:border-gold" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} />
            <button onClick={() => handleSend()} className="text-gold"><i className="fas fa-paper-plane"></i></button>
          </div>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${isOpen ? 'bg-white text-black rotate-90' : 'bg-gold text-black hover:scale-105'}`}>
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-robot'} text-xl`}></i>
      </button>
    </div>
  );
};

export default AIAssistant;