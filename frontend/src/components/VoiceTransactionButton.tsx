import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

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
      setTranscript(text);
      handleTranscript(text);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.');
      } else {
        setError('Speech recognition error. Please try again.');
      }
    };

    recognition.onend = () => {
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
    setIsProcessing(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://webapp-expense.onrender.com/api/voice/parse-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to process voice input');
      }

      if (data.success && data.amount) {
        // Create pending transaction
        await createPendingTransaction(data);
        setTranscript('');
        if (onTransactionCreated) {
          onTransactionCreated();
        }
      } else {
        setError(data.error || 'Could not understand the transaction. Please try again.');
      }
    } catch (err: any) {
      console.error('Error processing voice:', err);
      setError(err.message || 'Failed to process voice input');
    } finally {
      setIsProcessing(false);
    }
  };

  const createPendingTransaction = async (transaction: any) => {
    const token = localStorage.getItem('token');
    const response = await fetch('https://webapp-expense.onrender.com/api/pending-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
        type: transaction.type
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create transaction');
    }

    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
    successMsg.textContent = `✓ Added: ₹${transaction.amount} - ${transaction.description}`;
    document.body.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 3000);

    // Dispatch event to refresh pending transactions
    window.dispatchEvent(new Event('pendingTransactionsUpdated'));
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError('');
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
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