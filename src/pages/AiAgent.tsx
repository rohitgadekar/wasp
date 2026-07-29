import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTitle } from '@/hooks/use-title';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquarePlus, Menu, X, Clock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import ChatMessage, { Message } from '@/components/ai-agent/ChatMessage';
import ChatInput from '@/components/ai-agent/ChatInput';
import { cn } from '@/lib/utils';

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messageCount: number;
}

const AiAgent = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content: `Hey, I'm Nyra. What are we building, fixing, or optimizing today?`,
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isAuthorized = !roleLoading && (role === 'owner' || role === 'manager' || role === 'moderator');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Load chat sessions
  useEffect(() => {
    const loadChatSessions = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading chat sessions:', error);
        return;
      }

      if (data && data.length > 0) {
        // Group messages by date to create sessions
        const sessions: ChatSession[] = [];
        const sessionMap = new Map<string, Message[]>();

        data.forEach(msg => {
          const date = new Date(msg.created_at).toDateString();
          if (!sessionMap.has(date)) {
            sessionMap.set(date, []);
          }
          sessionMap.get(date)?.push({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at)
          });
        });

        sessionMap.forEach((msgs, date) => {
          const userMessages = msgs.filter(m => m.role === 'user');
          const firstUserMsg = userMessages[0];
          const title = firstUserMsg ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '') : 'New Chat';
          const preview = firstUserMsg ? firstUserMsg.content.slice(0, 80) : '';

          sessions.push({
            id: date,
            title,
            preview,
            timestamp: new Date(date),
            messageCount: msgs.length
          });
        });

        setChatSessions(sessions);

        // Load the most recent session
        if (!currentSessionId && sessions.length > 0) {
          loadSession(sessions[0].id);
        }
      }
    };

    loadChatSessions();
  }, [user?.id]);

  const loadSession = async (sessionId: string) => {
    if (!user) return;

    setCurrentSessionId(sessionId);

    const { data, error } = await supabase
      .from('ai_chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading session:', error);
      return;
    }

    if (data) {
      const sessionDate = new Date(sessionId).toDateString();
      const sessionMessages = data.filter(msg =>
        new Date(msg.created_at).toDateString() === sessionDate
      );

      const history: Message[] = sessionMessages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.created_at)
      }));

      setMessages([
        {
          id: 'init',
          role: 'assistant',
          content: `Hey, I'm Nyra. What are we building, fixing, or optimizing today?`,
          timestamp: new Date(history[0]?.timestamp.getTime() - 1000)
        },
        ...history
      ]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useTitle('Nyra AI', 'Codebase Intelligence Assistant');

  if (roleLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center  pt-28">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center  px-6 text-center overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-2xl w-full flex flex-col items-center justify-center">


          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-tight">
            Hey, {user?.user_metadata?.full_name.split(" ")[0] || "there"}
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-t from-primary to-primary/50">
              You're close… but not in yet.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-lg mx-auto leading-relaxed">
            Nyra isn't unlocked for you. Hit up your admin to get your access.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => navigate('/')}
              size="lg"
              className="rounded-full font-bold shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([{
      id: 'init',
      role: 'assistant',
      content: `Hey, I'm Nyra. What are we building, fixing, or optimizing today?`,
      timestamp: new Date()
    }]);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) return;

    const sessionDate = new Date(sessionId).toDateString();

    const { data: sessionMessages } = await supabase
      .from('ai_chat_messages')
      .select('id')
      .eq('user_id', user.id);

    if (sessionMessages) {
      const idsToDelete = sessionMessages
        .filter(msg => new Date(msg.id).toDateString() === sessionDate)
        .map(msg => msg.id);

      const { error } = await supabase
        .from('ai_chat_messages')
        .delete()
        .in('id', idsToDelete);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error deleting chat',
          description: error.message
        });
        return;
      }

      setChatSessions(prev => prev.filter(s => s.id !== sessionId));

      if (currentSessionId === sessionId) {
        handleNewChat();
      }

      toast({
        title: 'Chat deleted',
        description: 'The conversation has been removed.'
      });
    }
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

      let fullContent = '';

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

        // Refresh sessions
        const newSessionId = new Date().toDateString();
        if (!chatSessions.find(s => s.id === newSessionId)) {
          setChatSessions(prev => [{
            id: newSessionId,
            title: input.slice(0, 50) + (input.length > 50 ? '...' : ''),
            preview: input.slice(0, 80),
            timestamp: new Date(),
            messageCount: 2
          }, ...prev]);
        }
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

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex   overflow-hidden" style={{ top: '7rem' }}>
      {/* Sidebar */}
      <div className={cn(
        "flex-shrink-0 flex flex-col border-r border-[#E5DCCB] backdrop-blur-xl transition-all duration-300 ease-out overflow-hidden",
        sidebarOpen ? "w-64" : "w-0"
      )}>
        <div className="flex flex-col h-full p-4 min-h-0">
          {/* New Chat Button */}
          <Button
            onClick={handleNewChat}
            className="w-full rounded-2xl mb-4 flex-shrink-0 bg-gradient-to-br from-[#E2D4BF] via-[#BFA378] to-[#997C53] hover:opacity-90 text-white shadow-lg transition-all duration-300 h-12"
          >
            <MessageSquarePlus className="w-5 h-5 mr-2" />
            New Chat
          </Button>

          {/* Section label */}
          <p className="flex-shrink-0 text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 px-1 mb-3">
            Recent Chats
          </p>

          {/* Chat History — scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
            {chatSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <p>No chat history yet</p>
                <p className="text-xs mt-2">Start a conversation to see it here</p>
              </div>
            ) : (
              chatSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  className={cn(
                    "group relative p-3.5 rounded-xl cursor-pointer transition-all duration-200 border hover:border-[#C5A880] hover:bg-[#FAF8F5] dark:hover:bg-zinc-800",
                    currentSessionId === session.id
                      ? "bg-[#FAF8F5] dark:bg-zinc-800 border-[#C5A880] shadow-sm"
                      : "bg-transparent border-transparent"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-bold text-[#2C241B] dark:text-white truncate mb-0.5 capitalize">
                        {session.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 mt-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{formatDate(session.timestamp)}</span>
                        <span className="ml-auto shrink-0">{session.messageCount} msgs</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 shrink-0 mt-0.5"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Toggle Sidebar Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-3 left-3 z-50 rounded-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-[#E5DCCB] hover:bg-white dark:hover:bg-zinc-900 shadow-sm"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>

        <div className="relative z-10 flex-1 flex flex-col min-h-0">
          {/* Top fade — mirrors the bottom fade on ChatInput */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background to-transparent pointer-events-none z-20" />

          <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-32 xl:px-48 pb-40 pt-6 custom-scrollbar">
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
                      <span className="text-[8px] font-sans font-bold uppercase tracking-widest text-[#8C7654]">Nyra</span>
                    </div>
                    <div className="px-6 py-4 rounded-[2.5rem] border border-white/20 flex items-center gap-3">
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
      </div>
    </div>
  );
};

export default AiAgent;
