import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Sparkles, X, Activity, Zap, Info, Cpu } from 'lucide-react';
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
    recognitionRef.current?.stop();
    resetState();
  };

  // --- NEW: Advanced "Neural Shield" Visuals ---
  const NeuralShield = () => (
    <div className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-all duration-700 ${isHovered ? 'scale-125 opacity-100' : 'scale-100 opacity-0'}`}>
      
      {/* Outer Targeting Ring (Slow Spin) */}
      <div className="absolute w-32 h-32 rounded-full border border-indigo-500/20 border-t-indigo-400 border-b-purple-400 animate-[spin_8s_linear_infinite]" />
      
      {/* Inner Data Ring (Fast Reverse Spin) */}
      <div className="absolute w-24 h-24 rounded-full border border-dashed border-cyan-500/30 animate-[spin_4s_linear_infinite_reverse]" />
      
      {/* Pulse Field */}
      <div className="absolute w-full h-full bg-indigo-500/10 rounded-full blur-xl animate-pulse" />
      
      {/* Orbiting Satellite Dots */}
      <div className="absolute w-36 h-36 rounded-full animate-[spin_6s_linear_infinite]">
        <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
      </div>
      <div className="absolute w-28 h-28 rounded-full animate-[spin_5s_linear_infinite_reverse]">
        <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
      </div>
    </div>
  );

  return (
    <>
      {/* --- Main Floating AI Core --- */}
      <div className="fixed z-[9999] bottom-6 right-6 md:bottom-10 md:right-10 flex items-center justify-center group">
        
        {/* Render Neural Shield on Idle/Hover */}
        {!isListening && !isProcessing && <NeuralShield />}

        {/* Active Energy Rings (Listening State) */}
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
            transition-all duration-500 transform
            ${isHovered ? 'scale-110 shadow-[0_0_40px_rgba(99,102,241,0.5)]' : 'shadow-2xl shadow-indigo-500/30'}
            ${isListening ? 'scale-110 shadow-[0_0_60px_rgba(99,102,241,0.7)]' : ''}
          `}
        >
          {/* Background Gradient Mesh */}
          <div className={`
            absolute inset-0 rounded-full overflow-hidden transition-all duration-500
            ${isListening ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-900 to-indigo-950'}
          `}>
             {/* Core Glow - Reacts to State */}
             <div className={`
                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full
                bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 opacity-80 blur-lg
                transition-all duration-500
                ${isHovered && !isListening ? 'scale-90 opacity-90' : 'scale-75 opacity-70'}
                ${isListening ? 'animate-pulse scale-110 opacity-100' : ''}
                ${isProcessing ? 'animate-[spin_1s_linear_infinite] from-amber-500 via-orange-600 to-red-500' : ''}
             `} />
          </div>

          {/* Glass Overlay with Hex Pattern Hint */}
          <div className="absolute inset-0 rounded-full bg-white/5 backdrop-blur-[1px] border border-white/20" />

          {/* Icon Layer */}
          <div className="relative z-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
             {isProcessing ? (
               <Sparkles className="w-8 h-8 md:w-9 md:h-9 animate-spin" />
             ) : isListening ? (
               <Activity className="w-8 h-8 md:w-9 md:h-9 animate-bounce" />
             ) : (
               // Switch icon on hover to show "AI Ready"
               isHovered ? (
                 <Cpu className="w-8 h-8 md:w-9 md:h-9 animate-pulse text-cyan-200" />
               ) : (
                 <Mic className="w-8 h-8 md:w-9 md:h-9" />
               )
             )}
          </div>
        </button>
      </div>

      {/* --- Holographic HUD Overlay --- */}
      {(isListening || isProcessing || error) && (
        <div className="fixed inset-0 z-[9990] bg-slate-950/70 backdrop-blur-md transition-opacity duration-300 flex flex-col items-center justify-center">
          
          <div className="pointer-events-auto relative w-full max-w-lg mx-4">
            
            {/* Top Decorator Line (Scanner) */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

            {/* Main Glass Card */}
            <div className={`
              glass-card overflow-hidden transition-all duration-300
              bg-[#0f172a]/90 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.6)]
              rounded-3xl p-8 text-center relative
              ${error ? 'border-rose-500/30 shadow-rose-900/20' : 'border-indigo-500/30 shadow-indigo-900/20'}
            `}>
              
              {/* --- ALWAYS VISIBLE CLOSE BUTTON --- */}
              <button 
                onClick={handleCancel}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-all duration-200 z-20 group"
                title="Close"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>

              {/* Status Header */}
              <div className="flex items-center justify-center gap-3 mb-8">
                 {isProcessing ? (
                   <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                     <Zap className="w-3 h-3 animate-pulse text-amber-400" />
                     <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400">Processing Data</span>
                   </div>
                 ) : isListening ? (
                   <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                     <span className="text-[10px] font-bold tracking-widest uppercase text-red-400">Live Recording</span>
                   </div>
                 ) : (
                   <div className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
                     <span className="text-[10px] font-bold tracking-widest uppercase text-rose-400">Detection Failed</span>
                   </div>
                 )}
              </div>

              {/* Dynamic Text Area */}
              <div className="min-h-[80px] flex items-center justify-center mb-4">
                {error ? (
                  <p className="text-rose-400 font-medium">{error}</p>
                ) : (
                  <p className={`
                    text-2xl md:text-3xl font-light leading-snug transition-all duration-200
                    ${!transcript ? 'text-slate-600 italic' : 'text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-indigo-200 drop-shadow-sm'}
                  `}>
                    {transcript || "Listening for expenses..."}
                  </p>
                )}
              </div>
              
              {/* Helpful Hint (Only if no error and not processing) */}
              {!isProcessing && !error && (
                <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-3 animate-slide-up">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-medium bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/10">
                    <Info className="w-3.5 h-3.5" />
                    <span>AI Tip: You can speak multiple items!</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    "Spent 200 on Coffee and 5000 for Electricity Bill"
                  </p>
                </div>
              )}

              {/* Stop Button (When Listening) */}
              {isListening && (
                <div className="mt-8 flex justify-center">
                   <button 
                     onClick={toggleListening} // Use toggle to trigger normal stop/process
                     className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                   >
                     <div className="w-2 h-2 bg-white rounded-sm animate-pulse" /> Stop & Process
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