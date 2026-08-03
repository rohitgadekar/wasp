import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSubmit: (input: string) => void;
  isLoading: boolean;
}

const ChatInput = ({ onSubmit, isLoading }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSubmit(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 192)}px`;
    }
  }, [input]);

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-10 pb-6 px-4 z-50 pointer-events-none">
      <div className="max-w-4xl mx-auto w-full pointer-events-auto">
        <form onSubmit={handleSubmit} className="relative">
          {/* Glow effect on focus */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 rounded-[1.75rem] opacity-0 peer-focus-within:opacity-100 transition-opacity duration-700 blur-sm pointer-events-none" />

          <div className={cn(
            "relative flex w-full flex-col bg-white dark:bg-zinc-900 rounded-[2rem] border transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]",
            input ? "border-[#C5A880]/60 shadow-[0_4px_32px_rgba(197,168,128,0.15)]" : "border-[#E5DCCB] dark:border-zinc-800"
          )}>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Nyra"
              rows={1}
              className="w-full bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-6 pt-5 pb-4 resize-none text-[15px] font-normal placeholder:text-muted-foreground/40 custom-scrollbar leading-relaxed"
              disabled={isLoading}
            />

            <div className="flex items-center justify-between px-4 pb-3 pt-1">
              <span className="text-[8px] uppercase tracking-widest text-muted-foreground/30 font-bold pl-2">
                Shift + Enter for new line
              </span>
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className={cn(
                  "rounded-full w-10 h-10 shrink-0 transition-all duration-300",
                  input.trim()
                    ? "bg-[#2C241B] hover:bg-[#38322D] text-white shadow-md hover:scale-105 active:scale-95"
                    : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground cursor-not-allowed"
                )}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </form>
        {/* 
        <p className="text-center mt-3 text-[10px] uppercase tracking-widest text-muted-foreground/30 font-bold">
          Nyra can make mistakes. Verify critical code.
        </p> */}
      </div>
    </div>
  );
};

export default ChatInput;
