import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  X,
  Minus,
  Maximize2,
  Minimize2,
  Send,
  User,
  Sparkles,
  Mic,
  MicOff,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Database,
  Trash2,
} from 'lucide-react';
import { ActiveTab, DatasetProfile, MLResult, ForecastResult, DecisionResult, ChatMessage } from '../types';
import { generateHeuristicAgentResponse } from '../utils/aiChatFallback';

interface FloatingChatWidgetProps {
  data: Record<string, any>[];
  datasetName: string;
  profile: DatasetProfile;
  activeTab: ActiveTab;
  mlResult?: MLResult | null;
  forecastResult?: ForecastResult | null;
  decisionResult?: DecisionResult | null;
  onNavigateTab: (tab: ActiveTab) => void;
  onClose?: () => void;
  onBack?: () => void;
  onForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({
  data,
  datasetName,
  profile,
  activeTab,
  mlResult,
  forecastResult,
  decisionResult,
  onNavigateTab,
  onClose,
  onBack,
  onForward,
  canGoBack = false,
  canGoForward = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'dock-welcome',
      role: 'assistant',
      content: `👋 **Real-Time Data Assistant Active.**\n\nI am currently analyzing **${datasetName}** alongside your **${activeTab}** view. Ask me anything or request instant calculations!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: '📊 Summarize Data', prompt: 'Summarize key statistics for this dataset' },
        { label: '🤖 ML Suggestions', prompt: 'Which ML model is best for this data?' },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isGenerating]);

  // Handle Speech Recognition
  const toggleSpeechRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputPrompt(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend || inputPrompt).trim();
    if (!text || isGenerating) return;

    setInputPrompt('');
    const userMsgId = `dock-user-${Date.now()}`;
    const assistantMsgId = `dock-assistant-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp,
    };

    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp,
      isStreaming: true,
    };

    const updatedHistory = [...messages, newUserMsg];
    setMessages([...updatedHistory, initialAssistantMsg]);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
          datasetContext: {
            datasetName,
            activeTab,
            rows: profile.rows,
            columns: profile.columns,
            numericColumns: profile.numericColumns,
            categoricalColumns: profile.categoricalColumns,
            totalMissing: profile.totalMissing,
            mlResult: mlResult ? { bestModel: mlResult.bestModelName, score: mlResult.bestModelScore } : null,
            forecast: forecastResult ? { trend: forecastResult.trend, cagr: forecastResult.compoundAnnualGrowthRate } : null,
          },
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Streaming failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let useFallback = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        for (const line of chunkText.split('\n')) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                accumulated += data.chunk;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulated } : m))
                );
              }
              if (data.fallback) useFallback = true;
            } catch {}
          }
        }
      }

      if (useFallback || !accumulated.trim()) {
        const fallbackRes = generateHeuristicAgentResponse(text, {
          data,
          profile,
          datasetName,
          mlResult,
          forecastResult,
          decisionResult,
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: fallbackRes.text,
                  suggestedActions: fallbackRes.actions,
                  isStreaming: false,
                }
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, isStreaming: false } : m))
        );
      }
    } catch {
      const fallbackRes = generateHeuristicAgentResponse(text, {
        data,
        profile,
        datasetName,
        mlResult,
        forecastResult,
        decisionResult,
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: fallbackRes.text,
                suggestedActions: fallbackRes.actions,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDismissMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  // If closed, render floating trigger button
  if (!isOpen) {
    return (
      <button
        id="floating-chat-trigger"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-full shadow-2xl shadow-blue-600/50 hover:shadow-blue-500/60 transition-all hover:scale-105 border border-blue-400/30 group"
      >
        <div className="relative">
          <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="tracking-tight font-medium">Real-Time AI Copilot</span>
      </button>
    );
  }

  // Floating Chat Window
  return (
    <div
      id="floating-chat-window"
      className={`fixed z-50 transition-all duration-200 flex flex-col bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden ${
        isExpanded
          ? 'bottom-4 right-4 w-[calc(100vw-32px)] md:w-[700px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]'
          : 'bottom-4 right-4 w-[calc(100vw-32px)] sm:w-[420px] h-[min(560px,calc(100vh-2rem))] max-h-[calc(100vh-2rem)]'
      }`}
    >
      {/* Header */}
      <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xs text-white truncate">AI Copilot</h3>
              <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {datasetName}
            </p>
          </div>
        </div>

        {/* Feature Navigation (<, >, X) and Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Back & Ahead navigation */}
          <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5">
            <button
              id="btn-floating-nav-back"
              onClick={onBack}
              disabled={!canGoBack}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
              title="Back to previous feature (<)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-floating-nav-ahead"
              onClick={onForward}
              disabled={!canGoForward}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
              title="Ahead to next feature (>)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => onNavigateTab('chat')}
            className="text-[10px] px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition-colors hidden sm:block"
            title="Open Full Chat View"
          >
            Full View
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title={isExpanded ? 'Restore Size' : 'Expand Window'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Minimize to Floating Button"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-floating-chat-close"
            onClick={() => {
              setIsOpen(false);
              if (onClose) onClose();
            }}
            className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            title="Cross / Close Copilot (X)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const isCopied = copiedId === message.id;

          return (
            <div
              key={message.id}
              className={`flex gap-2.5 max-w-full group ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  isUser ? 'bg-blue-600 text-white' : 'bg-slate-800 text-blue-400'
                }`}
              >
                {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
              </div>

              <div className="space-y-1.5 max-w-[85%] relative">
                <div
                  className={`p-3 rounded-xl leading-relaxed relative ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-950/80 text-slate-200 border border-slate-800/90 rounded-tl-none'
                  }`}
                >
                  {/* Dismiss cross button on message */}
                  {!isUser && (
                    <button
                      onClick={() => handleDismissMessage(message.id)}
                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded transition-colors opacity-70 hover:opacity-100"
                      title="Cross / Dismiss this message (X)"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  {message.isStreaming && !message.content && (
                    <div className="flex items-center gap-1.5 text-slate-400 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse delay-100" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse delay-200" />
                    </div>
                  )}

                  {message.content && (
                    <div className="prose prose-invert prose-xs max-w-none text-slate-200 pr-4 prose-headings:text-slate-100 prose-headings:font-bold prose-headings:my-1.5 prose-p:my-1 prose-ul:my-1 prose-code:text-blue-300 prose-code:bg-slate-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {message.suggestedActions && (
                  <div className="flex flex-wrap gap-1">
                    {message.suggestedActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (action.tab) onNavigateTab(action.tab);
                          if (action.prompt) handleSendMessage(action.prompt);
                        }}
                        className="px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 text-[10px] font-medium flex items-center gap-1 transition-colors"
                      >
                        <span>{action.label}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    ))}
                  </div>
                )}

                <div className={`flex items-center gap-2 text-[10px] text-slate-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <span>{message.timestamp}</span>
                  {!isUser && message.content && (
                    <button
                      onClick={() => handleCopy(message.id, message.content)}
                      className="hover:text-slate-300 flex items-center gap-0.5"
                    >
                      {isCopied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-1.5"
        >
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`p-2 rounded-lg border transition-colors ${
              isListening
                ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
            title="Speech to Text"
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={`Ask about ${datasetName}...`}
            disabled={isGenerating}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            disabled={!inputPrompt.trim() || isGenerating}
            className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-400 rounded-lg transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
