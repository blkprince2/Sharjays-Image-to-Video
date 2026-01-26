
import React, { useState, useEffect, useRef } from 'react';
import { gemini } from '../geminiService';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Welcome to the Studio, Director. I am your Co-Pilot. How can I assist with your production today?' }
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (!chatSession) {
        const session = await gemini.startAssistantChat();
        setChatSession(session);
        const result = await session.sendMessage({ message: textToSend });
        setMessages(prev => [...prev, { role: 'assistant', text: result.text || "I'm processing that..." }]);
      } else {
        const result = await chatSession.sendMessage({ message: textToSend });
        setMessages(prev => [...prev, { role: 'assistant', text: result.text || "I'm processing that..." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Forgive me, my neural link is experiencing interference. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: "Motion Prompt", query: "Give me a cinematic motion prompt for a landscape with fog." },
    { label: "Script Fix", query: "Optimize this script for a professional voice: 'We are the best in the business and we want to show you why.'" },
    { label: "Help", query: "What is the difference between Image to Video and Lip-Sync?" }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="glass-effect w-[350px] md:w-[400px] h-[500px] rounded-2xl mb-4 flex flex-col shadow-2xl border border-gold/40 animate-slideUp">
          {/* Header */}
          <div className="p-4 border-b border-gold/20 flex justify-between items-center bg-gold/5 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="text-gold font-bold text-sm tracking-widest uppercase">Studio Co-Pilot</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition">
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-xl text-sm ${
                  m.role === 'user' 
                    ? 'bg-gold text-black font-medium' 
                    : 'bg-white/5 border border-white/10 text-white/90'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {!isLoading && messages.length < 5 && (
            <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
              {quickActions.map((qa, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(qa.query)}
                  className="whitespace-nowrap bg-gold/10 border border-gold/20 text-gold text-[10px] px-2 py-1 rounded-full hover:bg-gold/20 transition"
                >
                  {qa.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gold/20 bg-black/40">
            <div className="relative">
              <input 
                type="text"
                placeholder="Ask Co-Pilot..."
                className="w-full bg-[#1A1A1A] border border-gold/30 rounded-full py-2 pl-4 pr-10 text-xs text-white focus:outline-none focus:border-gold"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={() => handleSend()}
                className="absolute right-2 top-1.5 text-gold hover:scale-110 transition"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-white text-black rotate-90' : 'bg-gold text-black hover:scale-110'
        }`}
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-comment-dots'} text-xl`}></i>
        {!isOpen && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black animate-pulse"></div>}
      </button>
    </div>
  );
};

export default AIAssistant;
