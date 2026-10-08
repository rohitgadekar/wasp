import React, { useState, memo } from 'react';
import { User, Copy, Check, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import remarkGfm from 'remark-gfm';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  model?: string;
  routedReason?: string;
  isFallback?: boolean;
  isError?: boolean;
  failedPrompt?: string;
};

interface ChatMessageProps {
  message: Message;
  user: any;
  onRetry?: (failedPrompt: string, errorMsgId: string) => void;
  isLoading?: boolean;
}

const ChatMessage = memo(({ message, user, onRetry, isLoading }: ChatMessageProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: 'Code copied to clipboard!' });
  };

  return (
    <div
      className={cn(
        "flex max-w-4xl mx-auto w-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both",
        message.role === 'user' ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex max-w-[95%] md:max-w-[85%] gap-4 group",
        message.role === 'user' ? "flex-row-reverse" : "flex-row"
      )}>
        <div className={cn(
          "flex flex-col gap-2 min-w-0",
          message.role === 'user' ? "items-end" : "items-start"
        )}>
          {/* Metadata */}
          <div className={cn(
            "flex items-center gap-2 px-4 opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl flex-wrap",
            message.role === 'user' ? "flex-row-reverse" : "flex-row"
          )}>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">
              {message.role === 'user' ? 'Me' : 'Nyra'}
            </span>

            {message.role === 'assistant' && message.model && (
              <>
                <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span
                  className={cn(
                    "text-[9px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1",
                    message.isFallback
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      : "bg-black/5 dark:bg-white/10 text-muted-foreground/80 border-black/5 dark:border-white/10"
                  )}
                  title={message.routedReason || `Generated with ${message.model}`}
                >
                  {message.routedReason && <span className="text-amber-500 font-bold">⚡</span>}
                  {message.model}
                </span>
              </>
            )}

            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tighter">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <button
              onClick={() => handleCopy(message.content, message.id + '-full')}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors text-muted-foreground/40 hover:text-primary"
              title="Copy entire message"
            >
              {copiedId === message.id + '-full' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>

          {/* Message Bubble */}
          <div className={cn(
            "relative group/bubble px-6 py-4 rounded-[2em] text-[15.5px] leading-relaxed shadow-2xl backdrop-blur-2xl break-words w-full select-text cursor-auto",
            message.role === 'user'
              ? "bg-[#2C241B]/80 text-primary-foreground shadow-primary/20"
              : message.isError
                ? "bg-rose-50/90 dark:bg-rose-950/20 border border-rose-300/40 dark:border-rose-900/40 text-foreground shadow-rose-500/5"
                : "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl border border-black/5 dark:border-white/5 text-foreground shadow-black/5 dark:shadow-black/20"
          )}>
            <div className="prose prose-sm dark:prose-invert max-w-none break-words select-text cursor-text">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table({ children }) {
                    return (
                      <div className="my-6 overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10 shadow-sm bg-white/50 dark:bg-black/20">
                        <table className="min-w-full divide-y divide-black/5 dark:divide-white/10">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  thead({ children }) {
                    return <thead className="bg-black/[0.03] dark:bg-white/[0.03]">{children}</thead>;
                  },
                  th({ children }) {
                    return <th className="px-6 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-foreground/50">{children}</th>;
                  },
                  td({ children }) {
                    return <td className="px-6 py-4 text-sm font-medium border-t border-black/5 dark:border-white/5 text-foreground/80 leading-relaxed">{children}</td>;
                  },
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    const codeId = Math.random().toString(36).substring(7);

                    if (!inline && match) {
                      return (
                        <div className="relative group/code mt-6 mb-6 rounded-3xl overflow-hidden  bg-zinc-50 dark:bg-zinc-950/50">
                          <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-b border-white/5">
                            <div className="flex gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="h-5 text-[10px] uppercase font-black tracking-[0.2em] border-none text-muted-foreground/50">
                                {match[1]}
                              </Badge>
                              <button
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground/40 hover:text-primary"
                                onClick={() => handleCopy(codeString, codeId)}
                              >
                                {copiedId === codeId ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                          <SyntaxHighlighter
                            {...props}
                            style={oneLight}
                            language={match[1]}
                            showLineNumbers
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              padding: '1.5rem',
                              fontSize: '0.85rem',
                              background: 'transparent',
                              fontFamily: 'JetBrains Mono, Menlo, monospace'
                            }}
                          >
                            {codeString}
                          </SyntaxHighlighter>
                        </div>
                      );
                    }
                    return (
                      <code {...props} className={cn("bg-black/5 dark:bg-white/10  border border-black/5 dark:border-white/10 rounded-lg px-1.5 py-0.5 font-mono text-sm font-semibold", className)}>
                        {children}
                      </code>
                    );
                  },
                  p({ children }) {
                    return <p className="mb-4 last:mb-0 text-[15px] leading-relaxed font-medium opacity-90">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="list-disc pl-6 mb-4 space-y-2 opacity-90">{children}</ul>;
                  },
                  h3({ children }) {
                    return <h3 className="text-lg font-black tracking-tight mt-8 mb-4 text-foreground">{children}</h3>;
                  },
                  hr() {
                    return null;
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 bg-primary/80 dark:bg-primary/90 ml-1 translate-y-0.5 rounded-sm animate-pulse" />
              )}

              {/* Retry Button for Unsuccessful / Failed Prompts */}
              {message.isError && (
                <div className="mt-4 pt-3.5 border-t border-rose-500/20 flex items-center gap-3 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onRetry?.(message.failedPrompt || '', message.id)}
                    disabled={isLoading}
                    className="rounded-full h-8 px-4 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                    <span>{isLoading ? 'Retrying...' : 'Retry'}</span>
                  </Button>
                  <span className="text-[11px] text-muted-foreground/70">
                    Click to resend this prompt
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;