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
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      console.log('🎤 Speech recognized:', text);
      setTranscript(text);
      handleTranscript(text);
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      console.log('🛑 Speech recognition ended');
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleTranscript = async (text: string) => {
    console.log('📝 Processing transcript:', text);
    setIsProcessing(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token);
      console.log('🌐 Calling API:', API_ENDPOINTS.voiceParseTransaction);
      
      const response = await fetch(API_ENDPOINTS.voiceParseTransaction, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      console.log('📡 Response status:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📦 Response data:', data);

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
        console.error('❌ API Error:', errorMsg);
        throw new Error(errorMsg);
      }

      // Backend already creates pending transaction!
      if (data.success && data.amount) {
        console.log('✅ Transaction successful!', data);
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
        console.error('⚠️ API returned error:', data.error);
        setError(data.error);
      } else {
        console.warn('⚠️ Unexpected response:', data);
        setError('Could not understand the transaction. Please try again.');
      }
    } catch (err: any) {
      console.error('💥 Error processing voice:', err);
      setError(err.message || 'Failed to process voice input');
    } finally {
      console.log('🏁 Processing complete');
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

  const toggleListening = () => {
    console.log('🎙️ Toggle listening, current state:', isListening);
    
    if (!recognitionRef.current) {
      console.error('❌ Recognition not available');
      setError('Speech recognition not available');
      return;
    }

    if (isListening) {
      console.log('⏹️ Stopping recognition');
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      console.log('▶️ Starting recognition');
      setError('');
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
        console.log('✅ Recognition started');
      } catch (err) {
        console.error('❌ Failed to start recognition:', err);
        setError('Failed to start microphone');
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