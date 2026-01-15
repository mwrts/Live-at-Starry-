
import React, { useState, useRef, useEffect } from 'react';
import { BACKGROUND_IMAGE } from './constants';
import { CHARACTERS } from './characters';
import { ChatMessage, AppSettings } from './types';
import { callAI } from './services/aiService';
import { parseCharacterSegments } from './utils/parser';
import CharacterCard from './components/CharacterCard';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
  // Persistence Loading
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('starry_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [userName, setUserName] = useState(() => localStorage.getItem('starry_userName') || '');
  const [scenario, setScenario] = useState(() => localStorage.getItem('starry_scenario') || '');
  const [persona, setPersona] = useState(() => localStorage.getItem('starry_persona') || '');
  const [firstMessage, setFirstMessage] = useState(''); // Initial prompt for the bot
  const [isScenarioSet, setIsScenarioSet] = useState(() => localStorage.getItem('starry_isScenarioSet') === 'true');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('starry_settings');
    return saved ? JSON.parse(saved) : {
      useOpenRouter: false,
      openRouterKey: '',
      openRouterModel: 'google/gemini-2.0-flash-exp:free'
    };
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('starry_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('starry_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('starry_userName', userName);
    localStorage.setItem('starry_scenario', scenario);
    localStorage.setItem('starry_persona', persona);
    localStorage.setItem('starry_isScenarioSet', String(isScenarioSet));
  }, [userName, scenario, persona, isScenarioSet]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const handleResetSession = () => {
    setMessages([]);
    setScenario('');
    setPersona('');
    setUserName('');
    setFirstMessage('');
    setIsScenarioSet(false);
    localStorage.removeItem('starry_messages');
    localStorage.removeItem('starry_scenario');
    localStorage.removeItem('starry_persona');
    localStorage.removeItem('starry_userName');
    localStorage.setItem('starry_isScenarioSet', 'false');
    setShowSettings(false);
  };

  const handleRewind = () => {
    if (messages.length === 0 || isLoading) return;
    
    // Find the last index of a user message
    const lastUserIdx = [...messages].reverse().findIndex(m => m.role === 'user');
    
    if (lastUserIdx === -1) {
      // If there are no user messages, we can't rewind "before he sent a message"
      // but we might want to reset to just the initial state or prompt the user.
      return;
    }

    // Calculate the actual index in the original array
    const actualIdx = messages.length - 1 - lastUserIdx;
    
    // Keep everything before the last user message
    setMessages(messages.slice(0, actualIdx));
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenario.trim()) return;

    setIsScenarioSet(true);
    setIsLoading(true);

    try {
      // If user provided a first message, we use that as the first USER message to get things rolling
      let initialMessages: ChatMessage[] = [];
      
      if (firstMessage.trim()) {
        const userOpening: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: firstMessage,
          timestamp: new Date().toISOString()
        };
        initialMessages = [userOpening];
      }

      const responseText = await callAI(initialMessages, settings, userName, persona, scenario);
      const segments = parseCharacterSegments(responseText);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        segments: segments,
        timestamp: new Date().toISOString()
      };

      setMessages([...initialMessages, aiMessage]);
    } catch (error) {
      console.error("Failed to start session", error);
      setIsScenarioSet(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await callAI(newMessages, settings, userName, persona, scenario);
      const segments = parseCharacterSegments(responseText);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        segments: segments,
        timestamp: new Date().toISOString()
      };

      setMessages([...newMessages, aiMessage]);
    } catch (error) {
      console.error("Failed to get response", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (messageId: string) => {
    if (isLoading) return;
    
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const history = messages.slice(0, msgIndex);
    
    setIsLoading(true);
    try {
      const responseText = await callAI(history, settings, userName, persona, scenario);
      const segments = parseCharacterSegments(responseText);
      
      const newAiMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: responseText,
        segments: segments,
        timestamp: new Date().toISOString()
      };

      const updatedMessages = [...history, newAiMessage];
      setMessages(updatedMessages);
    } catch (error) {
      console.error("Regeneration failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const canRewind = messages.some(m => m.role === 'user');

  return (
    <div className="h-screen w-full flex items-center justify-center relative bg-slate-950">
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{ 
          backgroundImage: `url(${BACKGROUND_IMAGE})`,
          filter: 'blur(8px) brightness(0.35)'
        }}
      ></div>

      <div className="relative z-10 w-full max-w-5xl h-full max-h-[92vh] flex flex-col glass-card rounded-2xl overflow-hidden shadow-2xl mx-4">
        
        {/* Header */}
        <header className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex flex-col">
            <h1 className="text-white font-bold text-xl md:text-2xl tracking-tighter">Live at Starry!</h1>
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Shimokitazawa Scene</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex -space-x-2">
              {Object.values(CHARACTERS).map(c => (
                <img key={c.id} src={c.avatar} className="w-8 h-8 rounded-full border-2 border-slate-900 shadow-sm" title={c.name} alt={c.name} />
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              {isScenarioSet && (
                <button 
                  onClick={handleRewind}
                  disabled={!canRewind || isLoading}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                  title="Rewind to before last message"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
              )}
              
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors"
                title="Settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {!isScenarioSet ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center animate-fade-in overflow-y-auto">
              <form onSubmit={handleStartSession} className="w-full max-w-xl space-y-5 my-8">
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold text-white">Setup Your Session</h2>
                  <p className="text-slate-400 text-sm">Define the atmosphere and who you are.</p>
                </div>
                
                <div className="space-y-4 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-white/60 text-xs font-bold uppercase tracking-widest pl-1">Your Name</label>
                      <input 
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="What should they call you?"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-white/60 text-xs font-bold uppercase tracking-widest pl-1">Your Persona</label>
                      <input 
                        type="text"
                        value={persona}
                        onChange={(e) => setPersona(e.target.value)}
                        placeholder="A fan, a musician, a tourist..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-white/60 text-xs font-bold uppercase tracking-widest pl-1">The Scenario</label>
                    <textarea
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                      placeholder="e.g. Kessoku Band is practicing late, and someone brought exotic snacks..."
                      className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-white/60 text-xs font-bold uppercase tracking-widest pl-1">Initial Message (Optional)</label>
                    <input 
                      type="text"
                      value={firstMessage}
                      onChange={(e) => setFirstMessage(e.target.value)}
                      placeholder="What's your opening line?"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                    />
                    <p className="text-[10px] text-white/30 italic pl-1">If left blank, the bot will start the conversation based on the scenario.</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!scenario.trim() || isLoading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 mt-4"
                >
                  {isLoading ? 'Loading Stage...' : 'Enter Starry'}
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Chat Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12 scrollbar-hide">
                {messages.map((msg, idx) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'user' ? (
                      <div className="max-w-[85%] bg-blue-600/10 border border-blue-500/20 text-blue-100 px-6 py-4 rounded-2xl rounded-tr-none shadow-sm animate-fade-in backdrop-blur-md">
                        <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1 opacity-60">
                          {userName || 'Guest'}
                        </div>
                        <p className="text-sm md:text-base leading-relaxed font-medium">{msg.text}</p>
                      </div>
                    ) : (
                      <div className="w-full">
                        {msg.segments?.map((seg, sIdx) => (
                          <CharacterCard 
                            key={sIdx} 
                            characterKey={seg.character} 
                            content={seg.content} 
                            isLast={idx === messages.length - 1}
                            onRegenerate={() => handleRegenerate(msg.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex flex-col gap-4 animate-pulse pb-12">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10"></div>
                      <div className="w-24 h-2 bg-white/10 rounded-full"></div>
                    </div>
                    <div className="pl-13 space-y-2">
                      <div className="w-full h-3 bg-white/5 rounded-full"></div>
                      <div className="w-4/5 h-3 bg-white/5 rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Bar */}
              <div className="p-4 md:p-6 bg-black/40 border-t border-white/5">
                <form onSubmit={handleSend} className="relative flex items-center gap-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message the group..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all text-sm md:text-base"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="w-14 h-14 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg active:scale-90"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {showSettings && (
        <SettingsModal 
          settings={settings} 
          setSettings={setSettings} 
          onClose={() => setShowSettings(false)}
          onResetSession={handleResetSession}
        />
      )}
    </div>
  );
};

export default App;
