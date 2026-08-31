import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  HelpCircle,
  ArrowRight,
  Target,
  CheckCircle2,
  Radio,
  Zap,
} from 'lucide-react';
import { DatasetProfile, DecisionResult } from '../types';
import { evaluateBusinessDecision } from '../utils/decisionEngine';

interface VoiceAssistantViewProps {
  data: Record<string, any>[];
  profile: DatasetProfile;
  decisionResult: DecisionResult | null;
  setDecisionResult: (res: DecisionResult | null) => void;
  onNavigateToDecision: () => void;
}

const VOICE_PRESETS = [
  'Is revenue growth sustainable over the next three years?',
  'Should we scale our marketing expenditure for the upcoming quarter?',
  'What is the downside risk and volatility in our primary metrics?',
  'Evaluate operational stability and sample confidence for capital allocation.',
];

export const VoiceAssistantView: React.FC<VoiceAssistantViewProps> = ({
  data,
  profile,
  decisionResult,
  setDecisionResult,
  onNavigateToDecision,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition event:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    setRecognitionInstance(recognition);
  }, []);

  const toggleListening = () => {
    if (!recognitionInstance) {
      // Fallback: cycle preset
      setTranscript(VOICE_PRESETS[Math.floor(Math.random() * VOICE_PRESETS.length)]);
      return;
    }

    if (isListening) {
      recognitionInstance.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognitionInstance.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  const handleProcessSpokenQuestion = (questionText: string) => {
    if (!questionText.trim()) return;
    setIsProcessing(true);

    const dateCol = profile.datetimeColumns[0] || profile.columnMetas[0]?.name || '';
    const targetCol = profile.numericColumns[0] || '';

    setTimeout(() => {
      try {
        const result = evaluateBusinessDecision(data, dateCol, targetCol, questionText, 5);
        setDecisionResult(result);

        // Read out loud with SpeechSynthesis if available
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(
            `Insight AI recommendation: ${result.decision}. Risk profile is assessed as ${result.risk}. ${result.recommendation}`
          );
          utterance.rate = 1.05;
          window.speechSynthesis.speak(utterance);
        }
      } catch (err) {
        console.error('Voice decision pipeline error:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 400);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Mic className="w-4 h-4" />
          Natural Language Voice Decision Assistant
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Voice Decision Interface</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-xl mx-auto">
          Ask questions naturally using your microphone to evaluate dataset metrics and trigger automated decisions.
        </p>

        {/* Large Voice Recording Orb */}
        <div className="mt-8 flex flex-col items-center justify-center">
          <button
            id="btn-voice-toggle"
            onClick={toggleListening}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 relative ${
              isListening
                ? 'bg-rose-600 text-white shadow-2xl shadow-rose-600/50 scale-110 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 hover:scale-105'
            }`}
          >
            {isListening ? (
              <MicOff className="w-10 h-10 animate-bounce" />
            ) : (
              <Mic className="w-10 h-10" />
            )}

            {isListening && (
              <span className="absolute -inset-3 rounded-full border-2 border-rose-500/60 animate-ping" />
            )}
          </button>

          <div className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Radio className={`w-3.5 h-3.5 ${isListening ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
            {isListening ? 'Listening to speech...' : 'Click to Speak Question'}
          </div>
        </div>

        {/* Live Transcript Display */}
        <div className="mt-6 p-4 bg-slate-950/80 border border-slate-800 rounded-xl min-h-[70px] flex items-center justify-center">
          {transcript ? (
            <p className="text-sm font-semibold text-slate-100 italic">"{transcript}"</p>
          ) : (
            <p className="text-xs text-slate-400">
              {recognitionSupported
                ? 'Microphone ready. Click the button above and speak your query...'
                : 'Web Speech recognition is running in fallback simulation mode.'}
            </p>
          )}
        </div>

        {/* Run Spoken Decision CTA */}
        {transcript && (
          <div className="mt-4 flex justify-center">
            <button
              id="btn-run-voice-query"
              onClick={() => handleProcessSpokenQuestion(transcript)}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
            >
              {isProcessing ? <Zap className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isProcessing ? 'Synthesizing Spoken Decision...' : 'Process Spoken Decision'}
            </button>
          </div>
        )}

        {/* Presets List */}
        <div className="mt-8 border-t border-slate-800 pt-5 text-left">
          <div className="text-[11px] uppercase font-bold text-slate-400 mb-2">
            Or Click a Sample Spoken Query:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VOICE_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setTranscript(preset);
                  handleProcessSpokenQuestion(preset);
                }}
                className="p-3 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 rounded-xl text-left text-xs text-slate-300 hover:text-white transition-all flex items-start gap-2"
              >
                <Volume2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>{preset}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Spoken Decision Card Result */}
      {decisionResult && (
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Synthesized Voice Intelligence Result</h3>
            </div>
            <button
              onClick={onNavigateToDecision}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View Full Audit Trail <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Decision Outcome</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5">{decisionResult.decision}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Score & Risk</div>
              <div className="text-sm font-bold text-slate-200 mt-0.5">
                {decisionResult.score}/100 • {decisionResult.risk} Risk
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mt-4 font-medium">
            {decisionResult.recommendation}
          </p>
        </div>
      )}
    </div>
  );
};
