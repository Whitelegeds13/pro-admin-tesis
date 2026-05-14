"use client";

/**
 * Chatbot Component — Asistente Inteligente Palacio Gamer.
 *
 * Mejoras implementadas:
 * - Historial conversacional persistente
 * - SessionId para continuidad
 * - Envía userId para personalización
 * - Lazy loading del componente de Markdown
 * - Indicador de carrera detectada
 */

import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, User, ChevronDown, MessageSquare, RotateCcw, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Lazy load ReactMarkdown para reducir bundle size
const ReactMarkdown = lazy(() => import('react-markdown'));

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [detectedCareer, setDetectedCareer] = useState<string | null>(null);
  const { state: { isAuthenticated, client } } = useAuth();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (customContent?: string) => {
    const textToSend = customContent || input;
    if (!textToSend.trim() || isLoading) return;

    if (!customContent) {
      setInput('');
    }
    
    setIsLoading(true);
    
    const nuevoMensaje: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
    };
    
    const newMessages = [...messages, nuevoMensaje];
    setMessages(newMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          userId: client?._id,
          sessionId,
        }),
      });
      
      const data = await response.json();

      if (data.sessionId) setSessionId(data.sessionId);
      if (data.detectedCareer) setDetectedCareer(data.detectedCareer);
      
      setMessages((prev) => [
        ...prev, 
        { id: (Date.now() + 1).toString(), role: 'assistant', content: data.text || 'Sin respuesta.' }
      ]);
      
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev, 
        { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Lo siento, ha ocurrido un error. Intenta de nuevo.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleClearChat = () => {
    setMessages([]);
    setSessionId(null);
    setDetectedCareer(null);
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 p-4 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 hover:shadow-2xl transition-all duration-300 z-50 flex items-center justify-center group"
          >
            <MessageSquare className="w-6 h-6 mr-0 group-hover:mr-2 transition-all duration-300" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-sm font-medium">
              Asistente Gamer
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 w-80 sm:w-96 h-[32rem] max-h-[80vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 text-neutral-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 shrink-0 border-b border-white/10 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.4)]">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <Bot className="w-6 h-6 text-white text-shadow" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-indigo-700 animate-pulse"></div>
                </div>
                <div>
                  <h3 className="font-bold text-white leading-tight">Asistente Palacio</h3>
                  <p className="text-xs text-blue-100/80 font-medium">
                    {detectedCareer ? `🎓 ${detectedCareer}` : 'Expertos recomendando'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleClearChat}
                  title="Limpiar chat"
                  className="p-2 bg-black/10 hover:bg-black/20 rounded-full text-white/80 hover:text-white transition-colors border border-transparent hover:border-white/20"
                  aria-label="Limpiar chat"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-black/10 hover:bg-black/20 rounded-full text-white/80 hover:text-white transition-colors border border-transparent hover:border-white/20"
                  aria-label="Cerrar chat"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
              {messages.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center space-y-4 px-4"
                >
                  <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center mb-2 shadow-inner shadow-blue-500/20">
                    <Sparkles className="w-8 h-8 text-blue-400" />
                  </div>
                  <h4 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">¡Hola, {client?.name?.split(' ')[0] || 'amigo'}!</h4>
                  <p className="text-sm text-neutral-400 leading-relaxed font-light">
                    Dime qué estudias o a qué te dedicas y te recomendaré el equipo ideal para ti.
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center mt-4 w-full">
                    <button 
                      type="button"
                      onClick={() => handleSendMessage('Soy estudiante de Diseño Gráfico, busco un equipo.')}
                      disabled={isLoading}
                      className="px-3 py-2 rounded-full bg-neutral-800 text-xs text-neutral-300 border border-neutral-700 hover:bg-blue-600 hover:text-white hover:border-blue-500 cursor-pointer transition-colors shadow-sm focus:outline-none disabled:opacity-50"
                    >
                      🎨 Diseño Gráfico
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleSendMessage('Estudio Ingeniería de Software, ¿cuál es mi mejor opción?')}
                      disabled={isLoading}
                      className="px-3 py-2 rounded-full bg-neutral-800 text-xs text-neutral-300 border border-neutral-700 hover:bg-blue-600 hover:text-white hover:border-blue-500 cursor-pointer transition-colors shadow-sm focus:outline-none disabled:opacity-50"
                    >
                      💻 Ingeniería
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleSendMessage('Soy de Arquitectura, necesito una buena tarjeta gráfica.')}
                      disabled={isLoading}
                      className="px-3 py-2 rounded-full bg-neutral-800 text-xs text-neutral-300 border border-neutral-700 hover:bg-blue-600 hover:text-white hover:border-blue-500 cursor-pointer transition-colors shadow-sm focus:outline-none disabled:opacity-50"
                    >
                      🏗️ Arquitectura
                    </button>
                  </div>
                </motion.div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                >
                  <div className={`flex max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                      m.role === 'user' 
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                        : 'bg-gradient-to-br from-blue-600 to-blue-800'
                    }`}>
                      {m.role === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    
                    <div
                      className={`p-3 rounded-2xl ${
                        m.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none shadow-[0_4px_14px_0_rgba(37,99,235,0.2)]'
                          : 'bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-bl-none shadow-[0_4px_14px_0_rgba(0,0,0,0.1)]'
                      } prose prose-sm prose-invert max-w-none break-words`}
                    >
                      <Suspense fallback={<p className="text-[13px]">{m.content}</p>}>
                        <ReactMarkdown
                          components={{
                            h1: ({...props}) => <h1 className="text-lg font-bold mb-2 mt-4" {...props} />,
                            h2: ({...props}) => <h2 className="text-base font-bold mb-2 mt-3" {...props} />,
                            h3: ({...props}) => <h3 className="text-sm font-bold mb-1 mt-2" {...props} />,
                            ul: ({...props}) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                            ol: ({...props}) => <ol className="list-decimal pl-4 space-y-1 my-2" {...props} />,
                            li: ({...props}) => <li className="text-[13px] leading-relaxed marker:text-blue-400" {...props} />,
                            p: ({...props}) => <p className="text-[13px] leading-relaxed m-0" {...props} />,
                            strong: ({...props}) => <strong className="font-semibold text-blue-300" {...props} />,
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </Suspense>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex flex-row items-end gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-neutral-800 border border-neutral-700 p-3 rounded-2xl rounded-bl-none flex space-x-1.5 w-16 h-10 items-center justify-center py-4">
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-3 bg-neutral-950 border-t border-neutral-800 shrink-0">
              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <div className="relative flex items-center">
                  <input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ej: Estudio Arquitectura, ¿qué recomiendas?"
                    className="w-full bg-neutral-800 text-neutral-100 placeholder:text-neutral-500 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-neutral-700 focus:border-blue-500 transition-all text-sm shadow-inner"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-[10px] text-center text-neutral-600 font-medium tracking-wide pb-1">
                  IA con contexto • Recomendaciones personalizadas
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
