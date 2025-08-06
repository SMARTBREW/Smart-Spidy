import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Mic } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void> | void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [listening, setListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Waveform visualization refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Voice recognition logic
  const handleVoiceInput = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    setListening(true);
    
    // Start waveform visualization
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      drawWaveform();
    } catch (err) {
      setListening(false);
      alert('Could not access microphone.');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.start();
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage((prev) => prev ? prev + ' ' + transcript : transcript);
    };
    
    recognition.onerror = () => {
      setListening(false);
      stopWaveform();
    };
    
    recognition.onend = () => {
      setListening(false);
      stopWaveform();
    };
  };

  // Stop waveform and release audio resources
  const stopWaveform = () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
    sourceRef.current = null;
  };

  // Draw waveform as horizontal bars at the bottom (ChatGPT style)
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    
    analyser.getByteFrequencyData(dataArray);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Configuration for ChatGPT-style bars that spread across full width
    const barWidth = 2;
    const barSpacing = 1;
    const totalBarWidth = barWidth + barSpacing;
    const numBars = Math.floor(canvas.width / totalBarWidth); // Calculate bars based on canvas width
    const maxBarHeight = canvas.height * 0.8;
    const minBarHeight = 2;
    
    for (let i = 0; i < numBars; i++) {
      // Sample frequency data
      const dataIndex = Math.floor((i / numBars) * dataArray.length);
      const value = dataArray[dataIndex];
      
      // Convert to height (with some smoothing)
      const normalizedValue = value / 255;
      const barHeight = Math.max(minBarHeight, normalizedValue * maxBarHeight);
      
      // Position bars across full width
      const x = i * totalBarWidth;
      const y = canvas.height - barHeight;
      
      // Draw bar with rounded corners effect
      ctx.fillStyle = '#6B7280'; // Gray color similar to ChatGPT
      ctx.fillRect(x, y, barWidth, barHeight);
    }
    
    animationIdRef.current = requestAnimationFrame(drawWaveform);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopWaveform();
    };
  }, []);

  // Auto-grow textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  // File upload handler (images only)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setMessage((prev) => prev ? prev + ' [Image attached: ' + file.name + ']' : '[Image attached: ' + file.name + ']');
    } else if (file) {
      alert('Only image files are allowed.');
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      const messageToSend = message.trim();
      setMessage('');
      await onSendMessage(messageToSend);
    }
  };

  return (
    <div className="border-t border-gray-300 bg-white p-3 sm:p-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="flex gap-2 sm:gap-4 items-end">
          <div className="flex-1">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    await handleSubmit(e);
                  }
                }}
                placeholder={listening ? "Listening..." : "Type your message..."}
                rows={1}
                className="w-full resize-none rounded-xl border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 pr-12 text-black placeholder-gray-500 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 shadow-sm overflow-hidden text-sm sm:text-base"
                disabled={disabled || listening}
                style={{
                  minHeight: '44px',
                  maxHeight: '120px',
                  height: 'auto',
                  paddingBottom: listening ? '40px' : '12px', // Add space for waveform
                }}
              />
              
              {/* Waveform visualization canvas - positioned at bottom of textarea */}
              {listening && (
                <div className="absolute bottom-2 left-3 sm:left-4 right-16 pointer-events-none">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={24}
                    className="opacity-80 w-full"
                  />
                </div>
              )}
              
              <button
                type="button"
                className={`absolute right-10 top-2 p-1.5 sm:p-2 transition-colors duration-200 ${
                  listening 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                tabIndex={-1}
                onClick={listening ? () => { setListening(false); stopWaveform(); } : handleVoiceInput}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
                title={listening ? "Stop voice input" : "Start voice input"}
                disabled={disabled}
              >
                <Mic className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${listening ? 'animate-pulse' : ''}`} />
              </button>
              
              <label className="absolute right-2 top-2 p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={disabled}
                />
                <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </label>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!message.trim() || disabled || listening}
            className="bg-black text-white p-3 sm:p-4 mb-1 sm:mb-2 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm"
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </motion.button>
        </div>
      </form>
    </div>
  );
};