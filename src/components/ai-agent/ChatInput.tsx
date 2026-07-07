import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-12 pb-8 px-4 z-50 pointer-events-none">
      <div className="max-w-6xl mx-auto w-full pointer-events-auto">
        <form onSubmit={handleSubmit} className="relative flex items-center group">
          <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000 pointer-events-none" />
          <div className="relative flex w-full items-end bg-background/40 backdrop-blur-xl rounded-[2rem] border border-foreground/5 shadow-[0_8px_32px_rgba(0,0,0,0.1)] focus-within:border-foreground/10 focus-within:shadow-[0_8px_48px_rgba(0,0,0,0.15)] p-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Nyra..."
              className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-6 py-4 min-h-[60px] max-h-48 resize-none text-base font-normal placeholder:text-muted-foreground/30 custom-scrollbar"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="rounded-full w-12 h-12 shrink-0 bg-foreground text-background hover:opacity-90 shadow-sm transition-all ml-2 disabled:opacity-20"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </form>
        <div className="text-center mt-4">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-bold">
            Nyra can make mistakes. Verify critical code.
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
