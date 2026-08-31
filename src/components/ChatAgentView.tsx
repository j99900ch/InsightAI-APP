import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Download,
  Database,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Lightbulb,
  TrendingUp,
  BrainCircuit,
  Wand2,
  HelpCircle,
  Code2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ActiveTab, DatasetProfile, MLResult, ForecastResult, DecisionResult, ChatMessage } from '../types';
import { generateHeuristicAgentResponse } from '../utils/aiChatFallback';

interface ChatAgentViewProps {
  data: Record<string, any>[];
  datasetName: string;
  profile: DatasetProfile;
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

const STARTER_PROMPTS = [
  {
    id: 'p1',
    label: 'Executive Summary',
    icon: Sparkles,
    prompt: 'Provide an executive summary and high-level data findings for this dataset.',
  },
  {
    id: 'p2',
    label: 'Data Quality & Cleaning',
    icon: Wand2,
    prompt: 'Audit this dataset for missing values, outliers, and data cleaning recommendations.',
  },
  {
    id: 'p3',
    label: 'ML Problem & Feature Strategy',
    icon: BrainCircuit,
    prompt: 'Which column should I predict with Machine Learning, and which features are most important?',
  },
  {
    id: 'p4',
    label: 'Trend & Risk Forecast',
    icon: TrendingUp,
    prompt: 'What are the growth trajectories and potential business risks in our metrics?',
  },
  {
    id: 'p5',
    label: 'Python/SQL Snippets',
    icon: Code2,
    prompt: 'Generate Python pandas and SQL analysis queries tailored for this dataset schema.',
  },
  {
    id: 'p6',
    label: 'Correlation Insights',
    icon: Lightbulb,
    prompt: 'Analyze key correlations and relationships between the numerical metrics in this data.',
  },
];

export const ChatAgentView: React.FC<ChatAgentViewProps> = ({
  data,
  datasetName,
  profile,
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
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `👋 **Hello! I'm InsightAI's Real-Time Data Intelligence Agent.**

I have synchronized with **${datasetName}** (${profile.rows.toLocaleString()} records, ${profile.columns} columns).

Ask me anything about your data:
- 📊 **Exploratory statistics & correlation analysis**
- 🤖 **Machine Learning modeling & feature importance**
- 📈 **Time-series forecasting & CAGR growth trends**
- ⚖️ **Executive risk assessments & decision intelligence**
- 💻 **Custom Python / SQL data pipeline snippets**

Select a prompt preset below or type a custom question to begin!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: '📊 Dataset Summary', prompt: 'Provide an executive summary of this dataset' },
        { label: '🤖 ML Recommendations', prompt: 'Recommend best ML model and target variable' },
        { label: '🧹 Check Missing Values', tab: 'cleaning' },
      ],
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'online' | 'fallback' | 'checking'>('checking');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Check server health on mount
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const json = await res.json();
          setServerStatus(json.hasGeminiApiKey ? 'online' : 'fallback');
        } else {
          setServerStatus('fallback');
        }
      } catch {
        setServerStatus('fallback');
      }
    }
    checkHealth();
  }, []);

  // Prepare dataset context payload for Gemini
  const getDatasetContext = () => {
    // Generate sample distribution and summary
    const columnSummaries = profile.columnMetas.map((col) => ({
      name: col.name,
      type: col.type,
      missingCount: col.missingCount,
      uniqueCount: col.uniqueCount,
      sampleValues: col.sampleValues.slice(0, 3),
    }));

    return {
      datasetName,
      rows: profile.rows,
      columns: profile.columns,
      numericColumns: profile.numericColumns,
      categoricalColumns: profile.categoricalColumns,
      totalMissing: profile.totalMissing,
      missingPercentage: profile.missingPercentage,
      columnSummaries,
      activeMLResult: mlResult
        ? {
            targetColumn: mlResult.targetColumn,
            problemType: mlResult.problemType,
            bestModel: mlResult.bestModelName,
            bestScore: mlResult.bestModelScore,
            topFeatures: mlResult.featureImportances.slice(0, 5),
          }
        : null,
      activeForecast: forecastResult
        ? {
            target: forecastResult.targetColumn,
            trend: forecastResult.trend,
            cagr: forecastResult.compoundAnnualGrowthRate,
            rSquared: forecastResult.rSquared,
          }
        : null,
      activeDecision: decisionResult
        ? {
            decision: decisionResult.decision,
            risk: decisionResult.risk,
            score: decisionResult.score,
            recommendation: decisionResult.recommendation,
          }
        : null,
    };
  };

  // Handle Speech-to-Text Input
  const toggleSpeechRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser. Please type your query.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputPrompt(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Handle Text-to-Speech Output
  const handleSpeakText = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser environment.');
      return;
    }

    if (isSpeaking && speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean markdown symbols for natural speech
    const cleanText = text
      .replace(/#+\s+/g, '')
      .replace(/[*_`~]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/>\s+/g, '')
      .slice(0, 1200);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMsgId(msgId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Send message and stream response
  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend || inputPrompt).trim();
    if (!text || isGenerating) return;

    setInputPrompt('');

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: text,
      timestamp,
    };

    const initialAssistantMsg: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp,
      isStreaming: true,
    };

    const updatedHistory = [...messages, newUserMsg];
    setMessages([...updatedHistory, initialAssistantMsg]);
    setIsGenerating(true);

    const contextPayload = getDatasetContext();

    try {
      // Attempt SSE streaming call to Express Gemini server
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
          datasetContext: contextPayload,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Streaming connection failed, utilizing analytics engine');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let useFallback = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                accumulatedContent += data.chunk;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId ? { ...msg, content: accumulatedContent } : msg
                  )
                );
              }
              if (data.fallback) {
                useFallback = true;
              }
            } catch {
              // Ignore non-JSON SSE frames
            }
          }
        }
      }

      // If fallback was triggered or response was empty, run client-side dataset reasoning engine
      if (useFallback || !accumulatedContent.trim()) {
        const fallbackRes = generateHeuristicAgentResponse(text, {
          data,
          profile,
          datasetName,
          mlResult,
          forecastResult,
          decisionResult,
        });

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: fallbackRes.text,
                  suggestedActions: fallbackRes.actions,
                  isStreaming: false,
                }
              : msg
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
          )
        );
      }
    } catch (error: any) {
      console.warn('Realtime streaming fallback triggered:', error);
      const fallbackRes = generateHeuristicAgentResponse(text, {
        data,
        profile,
        datasetName,
        mlResult,
        forecastResult,
        decisionResult,
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: fallbackRes.text,
                suggestedActions: fallbackRes.actions,
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to reset the conversation transcript?')) {
      setMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: `Conversation transcript cleared. Ready for your next data science inquiry on **${datasetName}**.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const handleExportTranscript = () => {
    const transcript = messages
      .map(
        (m) =>
          `### [${m.timestamp}] ${m.role === 'user' ? '👤 User' : '🤖 InsightAI Agent'}\n\n${m.content}\n\n---\n`
      )
      .join('\n');

    const blob = new Blob(
      [`# InsightAI Real-Time Agent Transcript - ${datasetName}\n\n${transcript}`],
      { type: 'text/markdown' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `InsightAI_Agent_Transcript_${datasetName.replace(/\.[^/.]+$/, '')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="chat-agent-container" className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
      {/* Top Status & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shrink-0 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            <span
              className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                serverStatus === 'online' ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
              title={serverStatus === 'online' ? 'Gemini 3.7 Flash Connected' : 'InsightAI Analytics Engine'}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Real-Time Data Chat Agent</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Gemini 3.7 & Analytics
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>Synchronized with:</span>
              <span className="font-mono text-slate-200 font-semibold flex items-center gap-1">
                <Database className="w-3 h-3 text-blue-400" />
                {datasetName} ({profile.rows.toLocaleString()} rows, {profile.columns} cols)
              </span>
            </p>
          </div>
        </div>

        {/* Toolbar Navigation & Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Back, Ahead, Cross Feature Controls */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              id="btn-chat-nav-back"
              onClick={onBack}
              disabled={!canGoBack}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all flex items-center justify-center group"
              title="Back to previous feature (<)"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <button
              id="btn-chat-nav-ahead"
              onClick={onForward}
              disabled={!canGoForward}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all flex items-center justify-center group"
              title="Ahead to next feature (>)"
            >
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            {onClose && (
              <button
                id="btn-chat-nav-close"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center"
                title="Cross / Exit Chat to previous view (X)"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <button
            id="btn-export-transcript"
            onClick={handleExportTranscript}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors border border-slate-700/60"
            title="Download Transcript as Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Transcript</span>
          </button>

          <button
            id="btn-clear-chat"
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 hover:text-red-300 text-xs font-semibold text-slate-300 transition-colors border border-slate-700/60"
            title="Clear Chat History"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Chat Conversation Container */}
      <div className="flex-1 min-h-0 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col overflow-hidden backdrop-blur-sm">
        {/* Messages Stream Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            const isCopied = copiedId === message.id;
            const isThisSpeaking = isSpeaking && speakingMsgId === message.id;

            return (
              <div
                key={message.id}
                id={`chat-message-${message.id}`}
                className={`flex gap-3 max-w-4xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-blue-400 border border-slate-700'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble & Content */}
                <div className={`space-y-2 flex-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl p-4 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10 rounded-tr-none'
                        : 'bg-slate-950/80 text-slate-200 border border-slate-800 rounded-tl-none shadow-md'
                    }`}
                  >
                    {/* Streaming Indicator */}
                    {message.isStreaming && !message.content && (
                      <div className="flex items-center gap-2 text-slate-400 py-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-150" />
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse delay-300" />
                        <span className="text-xs font-mono">Analyzing dataset context in real time...</span>
                      </div>
                    )}

                    {/* Markdown Body */}
                    {message.content && (
                      <div className="prose prose-invert prose-sm max-w-none text-slate-200 prose-headings:text-slate-100 prose-headings:font-bold prose-headings:my-2 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-strong:text-white prose-code:text-blue-300 prose-code:bg-slate-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-table:my-2 prose-th:text-slate-300 prose-td:text-slate-300">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Interactive Suggested Actions */}
                  {message.suggestedActions && message.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {message.suggestedActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (action.tab) {
                              onNavigateTab(action.tab);
                            } else if (action.prompt) {
                              handleSendMessage(action.prompt);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-blue-200 border border-blue-500/20 text-xs font-medium transition-all group shadow-sm"
                        >
                          <span>{action.label}</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Message Meta & Action Controls */}
                  <div className={`flex items-center gap-2 text-[11px] text-slate-400 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span>{message.timestamp}</span>

                    {!isUser && message.content && (
                      <>
                        <span>•</span>
                        <button
                          onClick={() => handleCopyText(message.id, message.content)}
                          className="hover:text-slate-300 flex items-center gap-1 transition-colors"
                          title="Copy response"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>

                        <span>•</span>
                        <button
                          onClick={() => handleSpeakText(message.id, message.content)}
                          className={`hover:text-slate-300 flex items-center gap-1 transition-colors ${
                            isThisSpeaking ? 'text-blue-400 font-semibold' : ''
                          }`}
                          title="Read aloud"
                        >
                          {isThisSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          <span>{isThisSpeaking ? 'Stop Voice' : 'Listen'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Starter Chips Bar */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" />
            Quick Prompts:
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {STARTER_PROMPTS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  id={`btn-prompt-${item.id}`}
                  disabled={isGenerating}
                  onClick={() => handleSendMessage(item.prompt)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-50"
                >
                  <Icon className="w-3 h-3 text-blue-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Bar & Controls */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Microphone STT Button */}
            <button
              type="button"
              id="btn-voice-input"
              onClick={toggleSpeechRecognition}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse shadow-md shadow-red-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
              }`}
              title={isListening ? 'Listening... click to stop' : 'Click to talk via microphone'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Prompt Text Input */}
            <div className="flex-1 relative">
              <input
                id="chat-agent-input"
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={
                  isListening
                    ? 'Listening to speech...'
                    : `Ask real-time questions about ${datasetName}... (e.g. "What is the average revenue and CAGR?")`
                }
                disabled={isGenerating}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 pr-10 font-sans"
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              id="btn-chat-send"
              disabled={!inputPrompt.trim() || isGenerating}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-400 font-semibold text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 disabled:shadow-none shrink-0"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Bottom Footnote */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Real-time context injected: {profile.numericColumns.length} numeric, {profile.categoricalColumns.length} categorical columns</span>
            </span>
            <span className="font-mono text-slate-400">Shift + Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
};
