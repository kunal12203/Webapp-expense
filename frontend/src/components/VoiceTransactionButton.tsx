import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

interface VoiceTransactionButtonProps {
  onTransactionCreated?: () => void;
}

const VoiceTransactionButton: React.FC<VoiceTransactionButtonProps> = ({ onTransactionCreated }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>(''); // Store latest transcript

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Indian English - handles Hinglish well
    recognition.continuous = true; // Changed to true - keeps listening until manually stopped
    recognition.interimResults = true; // Show what user is saying in real-time
    recognition.maxAlternatives = 1;

    // Add onstart handler to confirm it started
    recognition.onstart = () => {
      console.log('🎤 Recognition actually started');
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      // Build complete transcript from all final results
      let completeTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          completeTranscript += event.results[i][0].transcript + ' ';
        }
      }
      
      // Get current interim result
      const resultIndex = event.results.length - 1;
      const currentText = event.results[resultIndex][0].transcript;
      
      // Combine final + interim
      const fullText = completeTranscript.trim() 
        ? completeTranscript.trim() + ' ' + currentText 
        : currentText;
      
      // Update both state and ref
      setTranscript(fullText);
      transcriptRef.current = fullText;
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      
      if (event.error === 'no-speech') {
        setError('No speech detected. Please speak clearly and try again.');
      } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setError('Microphone access denied. Please allow microphone access in browser settings.');
      } else if (event.error === 'network') {
        setError('Network error. Please check your internet connection.');
      } else if (event.error === 'aborted') {
        // Silent - user stopped intentionally
      } else {
        setError(`Speech recognition error: ${event.error}. Please try again.`);
      }
    };

    recognition.onend = () => {
      const finalTranscript = transcriptRef.current;
      
      setIsListening(false);
      
      // Process the transcript if we have something
      if (finalTranscript && finalTranscript.trim()) {
        handleTranscript(finalTranscript.trim());
      } else {
        setError('No speech detected. Please try again.');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleTranscript = async (text: string) => {
    setIsProcessing(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Not logged in. Please login first.');
        return;
      }
      
      const response = await fetch(API_ENDPOINTS.voiceParseTransaction, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error formats
        let errorMsg = 'Failed to process voice input';
        if (typeof data.detail === 'string') {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMsg = data.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
        } else if (data.detail) {
          errorMsg = JSON.stringify(data.detail);
        }
        throw new Error(errorMsg);
      }

      // Backend already creates pending transaction!
      if (data.success && data.amount) {
        // Show success message
        showSuccessMessage(data);
        
        // Clear transcript
        setTranscript('');
        
        // Notify parent component
        if (onTransactionCreated) {
          onTransactionCreated();
        }
        
        // Dispatch event to refresh pending transactions
        window.dispatchEvent(new Event('pendingTransactionsUpdated'));
      } else if (data.error) {
        setError(data.error);
      } else {
        setError('Could not understand the transaction. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process voice input');
    } finally {
      setIsProcessing(false);
    }
  };

  const showSuccessMessage = (transaction: any) => {
    const successMsg = document.createElement('div');
    successMsg.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] animate-fade-in';
    successMsg.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>Added: ₹${transaction.amount} - ${transaction.description}</span>
      </div>
    `;
    document.body.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 3000);
  };

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop(); // This will trigger onend which processes transcript
      setIsListening(false);
    } else {
      setError('');
      setTranscript('');
      transcriptRef.current = ''; // Clear ref
      
      // Check microphone permission first
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } catch (err: any) {
        setError('Microphone access required. Please allow microphone access.');
        return;
      }
      
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        if (err.message && err.message.includes('already started')) {
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current.start();
          }, 100);
        } else {
          setError('Failed to start microphone: ' + err.message);
        }
      }
    }
  };

  return (
    <>
      {/* Voice Button - Fixed position */}
      <button
        onClick={toggleListening}
        disabled={isProcessing}
        className={`
          fixed z-[9999] 
          bottom-6 right-6 md:bottom-8 md:right-8
          w-14 h-14 md:w-16 md:h-16
          rounded-full shadow-2xl
          flex items-center justify-center
          transition-all duration-300 transform
          ${isListening 
            ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse' 
            : 'bg-gradient-to-br from-indigo-600 to-violet-600 hover:scale-110 hover:shadow-indigo-500/50'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          disabled:opacity-50
        `}
        title={isListening ? 'Stop recording' : 'Start voice transaction'}
      >
        {isProcessing ? (
          <Loader2 className="w-6 h-6 md:w-7 md:h-7 text-white animate-spin" />
        ) : isListening ? (
          <MicOff className="w-6 h-6 md:w-7 md:h-7 text-white animate-pulse" />
        ) : (
          <Mic className="w-6 h-6 md:w-7 md:h-7 text-white" />
        )}
      </button>

      {/* Listening Indicator */}
      {isListening && (
        <div className="fixed bottom-24 right-6 md:bottom-28 md:right-8 bg-white dark:bg-slate-800 rounded-lg shadow-xl p-4 z-[9998] animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-1 h-6 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-6 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-6 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Listening...
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Say your expense (e.g., "I spent 500 on groceries")
          </p>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && transcript && (
        <div className="fixed bottom-24 right-6 md:bottom-28 md:right-8 bg-white dark:bg-slate-800 rounded-lg shadow-xl p-4 z-[9998] animate-fade-in max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Processing...
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 italic">
            "{transcript}"
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-24 right-6 md:bottom-28 md:right-8 bg-red-500 text-white rounded-lg shadow-xl p-4 z-[9998] animate-fade-in max-w-xs">
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={() => setError('')}
            className="text-xs underline mt-2 hover:text-red-100"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
};

export default VoiceTransactionButton;