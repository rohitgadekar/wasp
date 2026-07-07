import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTitle } from '@/hooks/use-title';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import ChatMessage, { Message } from '@/components/ai-agent/ChatMessage';
import ChatInput from '@/components/ai-agent/ChatInput';

const AiAgent = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content: 'Hey, I’m Nyra. What are we building, fixing, or optimizing today?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isAuthorized = !roleLoading && (role === 'owner' || role === 'manager' || role === 'moderator');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching chat history:', error);
        return;
      }

      if (data && data.length > 0) {
        const history: Message[] = data.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at)
        }));

        setMessages([
          {
            id: 'init',
            role: 'assistant',
            content: 'Hey, I’m Nyra. What are we building, fixing, or optimizing today?',
            timestamp: new Date(history[0]?.timestamp.getTime() - 1000)
          },
          ...history
        ]);
      }
    };

    fetchChatHistory();
  }, [user?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useTitle('Nyra AI', 'Codebase Intelligence Assistant');

  if (roleLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background pt-28">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6 text-center overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-2xl w-full flex flex-col items-center justify-center">
          <div className="relative inline-flex mb-10">
            <div className="relative w-32 h-32 rounded-full flex items-center justify-center">
              <img src="/nyra.png" alt="logo" className="rounded-full w-full h-full" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-tight">
            Hey,   {user?.user_metadata?.full_name.split(" ")[0] || "there"}
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-t from-primary to-primary/50">
              You’re close… but{" "}
              not in yet.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-lg mx-auto leading-relaxed">
            Nyra isn’t unlocked for you. Hit up your admin to get your access.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => navigate('/')}
              size="lg"
              className="rounded-full px-10 h-14 text-base font-bold shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleClearChat = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('ai_chat_messages')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error clearing chat',
        description: error.message
      });
      return;
    }

    setMessages([{
      id: 'init',
      role: 'assistant',
      content: 'Hey, I’m Nyra. What are we building, fixing, or optimizing today?',
      timestamp: new Date()
    }]);

    toast({
      title: 'Chat history cleared',
      description: 'Your conversation history has been wiped.'
    });
  };

  const handleSendMessage = async (input: string) => {
    if (!input.trim() || isLoading) return;

    const userMsgId = Date.now().toString();
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      if (user) {
        await supabase.from('ai_chat_messages').insert({
          user_id: user.id,
          role: 'user',
          content: userMsg.content
        });
      }

      const history = messages
        .filter(m => m.id !== 'init')
        .slice(-20)
        .map(m => ({ role: m.role, content: m.content }));

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: userMsg.content, history })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to communicate with Nyra');
      }

      if (!response.body) throw new Error('No stream available');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let isFirstChunk = true;
      const assistantMsgId = (Date.now() + 1).toString();

      let fullContent = ''; // The full content received from API

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let chunkAdded = false;

        for (const line of lines) {
          if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const textChunk = data.choices?.[0]?.delta?.content ||
                data.candidates?.[0]?.content?.parts?.[0]?.text ||
                '';

              if (textChunk) {
                if (isFirstChunk) {
                  setMessages(prev => [...prev, {
                    id: assistantMsgId,
                    role: 'assistant',
                    content: '',
                    timestamp: new Date(),
                    isStreaming: true
                  }]);
                  isFirstChunk = false;
                }

                fullContent += textChunk;
                chunkAdded = true;
              }
            } catch (e) {
              // Ignore incomplete JSON chunks
            }
          }
        }

        if (chunkAdded) {
          setMessages(prev => prev.map(m =>
            m.id === assistantMsgId ? { ...m, content: fullContent } : m
          ));
          scrollToBottom();
        }
      }

      // Mark streaming as complete
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId ? { ...m, isStreaming: false } : m
      ));
      scrollToBottom();

      if (user && fullContent) {
        await supabase.from('ai_chat_messages').insert({
          user_id: user.id,
          role: 'assistant',
          content: fullContent
        });
      }

    } catch (err: any) {
      console.error(err);

      const errorMessage = err.message || "An unexpected error occurred. Please try again.";
      const isRateLimit = errorMessage.toLowerCase().includes('rate limit') ||
        errorMessage.toLowerCase().includes('too many requests') ||
        errorMessage.toLowerCase().includes('slow down');

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isRateLimit
          ? `# **Whoa, Slow Down**\n\nYou're moving faster than we can keep up. You've hit the speed cap for now. Requests will be back shortly.`
          : `# **System Error**\n\n${errorMessage}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#fafafa] dark:bg-zinc-950 pt-28 overflow-hidden w-full overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col min-h-0 w-full overflow-x-hidden">
        {messages.length > 1 && (
          <div className="fixed top-24 right-4 md:right-8 z-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="rounded-full bg-background/50 backdrop-blur-md border border-white/10 shadow-lg text-muted-foreground hover:text-foreground hover:bg-transparent"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-32 xl:px-48 pb-40 custom-scrollbar w-full overflow-x-hidden">
          {messages.length === 1 && messages[0].id === 'init' && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8 -mt-20">
              <Badge className="bg-foreground/5 text-foreground/60 border border-foreground/10 rounded-full px-4 py-1 uppercase tracking-[0.3em] text-[10px] font-medium inline-flex items-center gap-2 backdrop-blur-sm">
                Neural Link Active
              </Badge>
              <h1 className="text-6xl md:text-8xl font-heading font-bold tracking-tight text-center leading-[1.1]">
                <span className="block luxury-heading opacity-60 text-5xl md:text-6xl mb-4">{getGreeting()},</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60 font-serif italic">
                  {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || ''}
                </span>
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto font-light leading-relaxed">
                How can I assist your engineering workflow today?
              </p>
            </div>
          )}

          <div className="max-w-6xl mx-auto space-y-8 w-full pb-8">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} user={user} />
            ))}

            {isLoading && !messages.some(m => m.isStreaming) && (
              <div className="flex w-full justify-start mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex max-w-[85%] gap-4 flex-row items-end">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white dark:bg-zinc-900 border border-white/20 flex items-center justify-center shrink-0 shadow-2xl overflow-hidden">
                    <img src="/nyra.png" alt="Thinking..." className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div className="px-6 py-4 rounded-[2.5rem]    border border-white/20 flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Analyzing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <ChatInput onSubmit={handleSendMessage} isLoading={isLoading} />
      </div>
    </div >
  );
};

export default AiAgent;