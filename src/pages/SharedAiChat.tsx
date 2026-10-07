import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getSharedChat, SharedChatData } from '@/services/aiChatShareService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTitle } from '@/hooks/use-title';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Share2,
  Copy,
  Check,
  ArrowLeft,
  Sparkles,
  Calendar,
  User,
  MessageSquare,
  Loader2,
  Bot,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { RiChatAiFill } from 'react-icons/ri';
import { supabase } from '@/integrations/supabase/client';

export const SharedAiChat: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [chat, setChat] = useState<SharedChatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();
  const { isSuperUser } = useUserRole();
  const navigate = useNavigate();

  useTitle(chat?.title ? `${chat.title} - Nyra AI` : 'Shared Chat - Nyra AI');

  useEffect(() => {
    const fetchChat = async () => {
      if (!shareId) {
        setLoading(false);
        return;
      }
      try {
        const data = await getSharedChat(shareId);
        setChat(data);
      } catch (e) {
        console.error('Failed to load shared chat:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
  }, [shareId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast({
        title: 'Copied link to clipboard',
        description: 'You can now share this URL with anyone.',
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Failed to copy',
      });
    }
  };

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
    toast({ title: 'Code copied to clipboard!' });
  };

  const handleContinueInNyra = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to continue this conversation in Nyra AI.',
      });
      navigate('/auth', { state: { returnTo: window.location.pathname } });
      return;
    }

    if (!isSuperUser) {
      toast({
        variant: 'destructive',
        title: 'Access Restricted',
        description: 'Nyra AI is reserved for workspace owners and managers.',
      });
      return;
    }

    if (!chat || !chat.messages || chat.messages.length === 0) {
      navigate('/ai-agent');
      return;
    }

    setIsImporting(true);
    const baseTime = Date.now();
    try {
      // Copy conversation into the user's ai_chat_messages history
      const rows = chat.messages.map((m, idx) => ({
        user_id: user.id,
        role: m.role,
        content: m.content,
        created_at: new Date(baseTime + idx * 1000).toISOString(),
      }));

      const { error } = await supabase.from('ai_chat_messages').insert(rows);
      if (error) {
        console.warn('Could not insert to Supabase, continuing with navigation state:', error);
      }

      toast({
        title: 'Conversation copied!',
        description: 'Opened in your Nyra AI workspace.',
      });

      navigate('/ai-agent', {
        state: {
          importedMessages: chat.messages,
          importedTitle: chat.title,
          importedDate: new Date(baseTime).toDateString(),
        },
      });
    } catch (err: any) {
      console.error('Failed to import chat:', err);
      navigate('/ai-agent', {
        state: {
          importedMessages: chat.messages,
          importedTitle: chat.title,
        },
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#12110F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#C5A880]" />
          <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
            Loading shared conversation...
          </p>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#12110F] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-[#1C1A17] p-8 md:p-10 rounded-[2.5rem] border border-[#E5DCCB] dark:border-[#332E28] shadow-2xl">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-[#C5A880]/15 text-[#8C7654]">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-heading font-bold text-[#2C241B] dark:text-white">
              Conversation Not Found
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This shared chat link does not exist, has expired, or the author has revoked access.
            </p>
          </div>
          <Button
            onClick={() => navigate('/')}
            className="w-full h-11 rounded-2xl bg-[#2C241B] text-white hover:bg-[#38322D] font-bold text-xs uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(chat.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#12110F] text-[#2C241B] dark:text-[#EFEAE2] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40  bg-[#FAF8F5]/80 dark:bg-[#12110F]/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 group transition-transform hover:scale-105"
            >
              <div className="w-9 h-9 rounded-full  bg-gradient-to-br from-[#2C241B] to-[#4A3E31] text-[#EFEAE2] flex items-center justify-center shadow-md">
                <RiChatAiFill className="w-5 h-5 text-[#C5A880]" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold text-sm tracking-tight">Nyra AI</span>
                <span className="text-[9px] uppercase tracking-widest text-[#8C7654] font-bold">
                  Shared Chat
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-9 rounded-full border-[#E5DCCB] dark:border-[#38322D] text-xs font-semibold px-4 flex items-center gap-1.5 hover:bg-[#C5A880]/15 hover:text-black"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </Button>

            {isSuperUser ? (
              <Button
                size="sm"
                onClick={handleContinueInNyra}
                disabled={isImporting}
                className="h-9 rounded-full bg-[#2C241B] dark:bg-[#EFEAE2] text-white dark:text-[#2C241B] hover:opacity-90 text-xs font-semibold px-4 flex items-center gap-1.5"
              >
                {isImporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bot className="w-3.5 h-3.5" />
                )}
                <span>{isImporting ? 'Copying...' : 'Continue in Nyra'}</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleContinueInNyra}
                className="h-9 rounded-full bg-[#2C241B] dark:bg-[#EFEAE2] text-white dark:text-[#2C241B] hover:opacity-90 text-xs font-semibold px-4 flex items-center gap-1.5"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Try Nyra AI</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Conversation Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Chat Title & Metadata Header */}
        <div className="mb-10 pb-6 border-b border-[#E5DCCB]/60 dark:border-[#2C2722] space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full border-[#E5DCCB] dark:border-[#38322D] text-[#8C7654] text-[10px] tracking-wider uppercase font-bold px-3 py-0.5"
            >
              Read-Only
            </Badge>
            <span className="text-xs text-muted-foreground">•</span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
            {chat.shared_by_name && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <User className="w-3.5 h-3.5" />
                  <span>Shared by {chat.shared_by_name}</span>
                </div>
              </>
            )}
          </div>

          <h1 className="text-2xl md:text-4xl font-heading font-bold text-[#2C241B] dark:text-white tracking-tight">
            {chat.title}
          </h1>
        </div>

        {/* Message Stream */}
        <div className="space-y-8">
          {chat.messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex w-full animate-in fade-in slide-in-from-bottom-2 duration-500',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'flex max-w-[95%] md:max-w-[85%] gap-4 group',
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div
                  className={cn(
                    'flex flex-col gap-2 min-w-0',
                    message.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  {/* Sender Label */}
                  <div className="flex items-center gap-2 px-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">
                      {message.role === 'user' ? (chat.shared_by_name || 'User') : 'Nyra'}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      'relative px-6 py-4 rounded-[2em] text-[15.5px] leading-relaxed shadow-lg break-words w-full select-text cursor-auto',
                      message.role === 'user'
                        ? 'bg-[#2C241B] text-white shadow-[#2C241B]/15'
                        : 'bg-white/90 dark:bg-[#1E1C18] border border-[#E5DCCB]/60 dark:border-[#332E28] text-foreground'
                    )}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words select-text cursor-text">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ inline, className, children, style: _codeStyle, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean; node?: unknown }) {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeString = String(children).replace(/\n$/, '');
                            const codeId = `${message.id}-${Math.random()}`;

                            return !inline && match ? (
                              <div className="relative my-4 rounded-xl overflow-hidden border border-[#E5DCCB]/80 dark:border-[#38322D] shadow-sm">
                                <div className="flex items-center justify-between px-4 py-1.5 bg-[#FAF8F5] dark:bg-[#28241F] border-b border-[#E5DCCB]/60 dark:border-[#38322D] text-[11px] font-mono text-muted-foreground">
                                  <span>{match[1]}</span>
                                  <button
                                    onClick={() => handleCopyCode(codeString, codeId)}
                                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                                  >
                                    {copiedCodeId === codeId ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-500" />
                                        <span>Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <SyntaxHighlighter
                                  {...props}
                                  style={oneLight as Record<string, React.CSSProperties>}
                                  language={match[1]}
                                  PreTag="div"
                                  className="!m-0 !p-4 !bg-[#FAF9F6] dark:!bg-[#191715] text-[13px] font-mono"
                                >
                                  {codeString}
                                </SyntaxHighlighter>
                              </div>
                            ) : (
                              <code
                                className={cn(
                                  'bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-[13px] font-mono',
                                  className
                                )}
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info box */}
        <div className="mt-16 p-6 rounded-3xl border border-[#E5DCCB]/80 dark:border-[#332E28] bg-white/60 dark:bg-[#1A1815] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="font-heading font-bold text-sm text-[#2C241B] dark:text-white">
              Continue this conversation in Nyra
            </h4>
            <p className="text-xs text-muted-foreground">
              Clone this conversation into your Nyra AI history and continue asking questions.
            </p>
          </div>
          <Button
            onClick={handleContinueInNyra}
            disabled={isImporting}
            className="rounded-full bg-[#2C241B] text-white hover:bg-[#38322D] text-xs font-bold uppercase tracking-wider px-6 h-10 shrink-0 flex items-center gap-2"
          >
            {isImporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Bot className="w-3.5 h-3.5" />
            )}
            <span>{isImporting ? 'Cloning to your account...' : 'Continue This Chat'}</span>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default SharedAiChat;
