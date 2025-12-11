import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Sparkles, X, Activity, Zap, Info } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

interface VoiceTransactionButtonProps {
  onTransactionCreated?: () => void;
}

const VoiceTransactionButton: React.FC<VoiceTransactionButtonProps> = ({ onTransactionCreated }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const isCancelledRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let completeTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          completeTranscript += event.results[i][0].transcript + ' ';
        }
      }
      const currentText = event.results[event.results.length - 1][0].transcript;
      const fullText = completeTranscript.trim() ? completeTranscript.trim() + ' ' + currentText : currentText;
      
      setTranscript(fullText);
      transcriptRef.current = fullText;
    };

    recognition.onerror = (event: any) => {
      if (isCancelledRef.current) return;
      setIsListening(false);
      if (event.error !== 'aborted') {
        setError(event.error === 'no-speech' ? 'No speech detected.' : 'Microphone error.');
      }
    };

    recognition.onend = () => {
      if (isCancelledRef.current) {
        resetState();
        return;
      }

      setIsListening(false);
      const finalTranscript = transcriptRef.current;
      
      if (finalTranscript && finalTranscript.trim()) {
        handleTranscript(finalTranscript.trim());
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const resetState = () => {
    setIsListening(false);
    setIsProcessing(false);
    setTranscript('');
    setError('');
    transcriptRef.current = '';
    isCancelledRef.current = false;
  };

  const handleTranscript = async (text: string) => {
    // If cancelled just before processing started
    if (isCancelledRef.current) return;

    setIsProcessing(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      const response = await fetch(API_ENDPOINTS.voiceParseTransaction, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      // Check cancel again after async op
      if (isCancelledRef.current) return;

      const data = await response.json();

      if (!response.ok) throw new Error(data.detail || 'Processing failed');

      if (data.success && data.amount) {
        showSuccessMessage(data);
        resetState();
        if (onTransactionCreated) onTransactionCreated();
        window.dispatchEvent(new Event('expensesUpdated'));
      } else {
        throw new Error(data.error || 'Could not understand transaction');
      }
    } catch (err: any) {
      if (!isCancelledRef.current) {
        setError(err.message);
      }
    } finally {
      if (!isCancelledRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const showSuccessMessage = (transaction: any) => {
    const successMsg = document.createElement('div');
    successMsg.className = 'fixed top-24 right-4 bg-emerald-500/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl z-[10000] animate-slide-in border border-emerald-400/30';
    successMsg.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="bg-white/20 p-2 rounded-full"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>
        <div>
          <div class="font-bold text-sm">Transaction Added</div>
          <div class="text-xs opacity-90 mt-0.5">₹${transaction.amount} • ${transaction.category}</div>
        </div>
      </div>
    `;
    document.body.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 3000);
  };

  const toggleListening = async () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      resetState();
      try {
        await recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    recognitionRef.current?.stop(); // Stop mic
    resetState(); // Clear all UI
  };

  // SVG for circular text
  const CircularText = () => (
    <div className={`
      absolute w-28 h-28 pointer-events-none transition-all duration-500
      ${isHovered ? 'opacity-100 scale-110' : 'opacity-40 scale-90'}
      ${isListening ? 'opacity-0' : ''}
    `}>
      <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_10s_linear_infinite]">
        <path
          id="circlePath"
          d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
          fill="none"
        />
        <text className="fill-indigo-500 dark:fill-indigo-300 font-mono text-[17px] font-bold tracking-widest uppercase">
          <textPath href="#circlePath" startOffset="0%">
            RECORD YOUR EXPENSE
          </textPath>
        </text>
      </svg>
    </div>
  );

  return (
    <>
      {/* --- Main Floating AI Core --- */}
      <div className="fixed z-[9999] bottom-6 right-6 md:bottom-10 md:right-10 flex items-center justify-center">
        
        {/* Rotating Text Ring */}
        {!isListening && !isProcessing && <CircularText />}

        {/* Orbiting Energy Rings */}
        {isListening && (
          <>
            <div className="absolute w-32 h-32 rounded-full border border-indigo-500/30 animate-[spin_3s_linear_infinite]" />
            <div className="absolute w-28 h-28 rounded-full border border-dashed border-purple-500/40 animate-[spin_4s_linear_infinite_reverse]" />
            <div className="absolute w-40 h-40 rounded-full border border-cyan-400/20 animate-ping opacity-20" />
          </>
        )}

        {/* The Core Button */}
        <button
          onClick={toggleListening}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          disabled={isProcessing}
          className={`
            relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center
            transition-all duration-500 transform hover:scale-105 active:scale-95
            ${isListening ? 'shadow-[0_0_50px_rgba(99,102,241,0.6)]' : 'shadow-2xl shadow-indigo-500/30'}
          `}
        >
          {/* Background Gradient */}
          <div className={`
            absolute inset-0 rounded-full overflow-hidden transition-all duration-500
            ${isListening ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-900 to-indigo-950'}
          `}>
             <div className={`
                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full
                bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 opacity-80 blur-lg
                transition-all duration-500
                ${isListening ? 'animate-pulse scale-110' : 'scale-75'}
                ${isProcessing ? 'animate-[spin_1s_linear_infinite] from-amber-500 via-orange-600 to-red-500' : ''}
             `} />
          </div>

          {/* Glass Overlay */}
          <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-[1px] border border-white/20" />

          {/* Icon */}
          <div className="relative z-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
             {isProcessing ? (
               <Sparkles className="w-8 h-8 md:w-9 md:h-9 animate-spin" />
             ) : isListening ? (
               <Activity className="w-8 h-8 md:w-9 md:h-9 animate-bounce" />
             ) : (
               <Mic className="w-8 h-8 md:w-9 md:h-9" />
             )}
          </div>
        </button>
      </div>

      {/* --- Holographic HUD Overlay --- */}
      {(isListening || isProcessing || error) && (
        <div className="fixed inset-0 z-[9990] bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 flex flex-col items-center justify-center">
          
          <div className="pointer-events-auto relative w-full max-w-lg mx-4">
            
            {/* Top Decorator Line */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

            {/* Main Card */}
            <div className={`
              glass-card overflow-hidden transition-all duration-300
              bg-slate-900/80 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]
              rounded-3xl p-8 text-center relative
              ${error ? 'border-rose-500/30' : 'border-indigo-500/30'}
            `}>
              
              {/* --- ALWAYS VISIBLE CLOSE BUTTON --- */}
              <button 
                onClick={handleCancel}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-all duration-200 z-20 group"
                title="Close"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>

              {/* Header */}
              <div className="flex items-center justify-center gap-2 mb-6 text-xs font-bold tracking-[0.2em] uppercase text-indigo-400">
                {isProcessing ? (
                   <>
                    <Zap className="w-4 h-4 animate-pulse text-amber-400" />
                    <span className="text-amber-400 animate-pulse">Processing...</span>
                   </>
                ) : isListening ? (
                   <>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span className="text-indigo-300">Listening</span>
                   </>
                ) : (
                  <span className="text-rose-400">Error</span>
                )}
              </div>

              {/* Text Area */}
              <div className="min-h-[60px] flex items-center justify-center">
                {error ? (
                  <p className="text-rose-400 font-medium">{error}</p>
                ) : (
                  <p className={`
                    text-xl md:text-2xl font-light leading-relaxed transition-all duration-200
                    ${!transcript ? 'text-slate-500 italic' : 'text-white drop-shadow-md'}
                  `}>
                    {transcript || "Speak now..."}
                  </p>
                )}
              </div>
              
              {/* Hints */}
              {!isProcessing && !error && (
                <div className="mt-6 flex flex-col items-center gap-2 animate-fade-in">
                  <div className="flex items-center gap-2 text-indigo-300/60 text-xs">
                    <Info className="w-3 h-3" />
                    <span>Say multiple expenses at once!</span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    "Breakfast 200, Taxi 300, and Groceries 1500"
                  </p>
                </div>
              )}

              {/* Bottom Cancel (Redundant but good for UX) */}
              {isListening && (
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
                   <button 
                     onClick={handleCancel}
                     className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 text-sm font-semibold transition-colors border border-white/5 hover:border-white/20 flex items-center gap-2 group"
                   >
                     <X className="w-4 h-4 group-hover:text-rose-400 transition-colors" /> Stop Recording
                   </button>
                </div>
              )}
              
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceTransactionButton;