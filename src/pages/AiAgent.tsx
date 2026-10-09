import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTitle } from '@/hooks/use-title';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquarePlus, Menu, X, Clock, Trash2, ArrowLeft, ShieldAlert, Share2, ArrowDown, MoreVertical } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import ChatMessage, { Message } from '@/components/ai-agent/ChatMessage';
import ChatInput from '@/components/ai-agent/ChatInput';
import { ShareChatDialog } from '@/components/ai-agent/ShareChatDialog';
import { cn } from '@/lib/utils';
import { RiChatAiFill } from 'react-icons/ri';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL_ID,
  DEFAULT_MODEL,
  routeQuery,
  AIModelConfig,
  parseSkillCommand
} from '@/lib/ai-models';

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
      content: `What are we building, fixing, or optimizing today?`,
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareChatTitle, setShareChatTitle] = useState('');
  const [shareChatMessages, setShareChatMessages] = useState<Message[]>([]);
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Multi-model selection & smart token routing state
  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
    const saved = localStorage.getItem('Lumen_selected_model');
    if (saved && AVAILABLE_MODELS.some(m => m.id === saved)) {
      return saved;
    }
    return DEFAULT_MODEL_ID;
  });
  const [activeRoutedModel, setActiveRoutedModel] = useState<AIModelConfig | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Analyzing...');

  // Scroll & Smart Auto-Scroll Detection (Grok / ChatGPT style)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef<boolean>(true);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthorized = !roleLoading && (role === 'owner' || role === 'manager' || role === 'moderator' || role === 'member');

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
      }
    };

    loadChatSessions();
  }, [user?.id]);

  // Handle conversation imported from shared link
  useEffect(() => {
    if (location.state?.importedMessages && Array.isArray(location.state.importedMessages)) {
      const formatted: Message[] = location.state.importedMessages.map((m: { id?: string; role: 'user' | 'assistant'; content: string; timestamp: string | Date }) => ({
        id: m.id || `${Date.now()}-${Math.random()}`,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
      }));

      setMessages([
        {
          id: 'init',
          role: 'assistant',
          content: `What are we building, fixing, or optimizing today?`,
          timestamp: new Date(formatted[0]?.timestamp ? new Date(formatted[0].timestamp).getTime() - 1000 : Date.now()),
        },
        ...formatted,
      ]);

      if (location.state.importedDate) {
        setCurrentSessionId(location.state.importedDate);
      }

      // Clear navigation state to prevent duplicate-applying on reload
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
          content: `What are we building, fixing, or optimizing today?`,
          timestamp: new Date(history[0]?.timestamp.getTime() - 1000)
        },
        ...history
      ]);

      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
          isAtBottomRef.current = true;
          setShowScrollButton(false);
        }
      }, 60);
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const atBottom = distanceToBottom < 80;
    isAtBottomRef.current = atBottom;
    setShowScrollButton(!atBottom);
  };

  const scrollToBottom = (smooth = false) => {
    if (!scrollContainerRef.current) return;
    if (smooth) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
    isAtBottomRef.current = true;
    setShowScrollButton(false);
  };

  useTitle('Lumen AI', 'Codebase Intelligence Assistant');

  if (roleLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center  pt-28">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div
          className="w-full max-w-md rounded-[2em] p-8 md:p-10 text-center space-y-6"
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border shadow-inner"
          >
            <ShieldAlert className="w-8 h-8 text-[#C5A880]" />
          </div>

          <div className="space-y-2">
            <Badge
              variant="outline"
              className="uppercase rounded-full border-[#E5DCCB] text-[#8C7654] text-[10px] tracking-widest px-3 py-1 font-bold"
            >
              Access Restricted
            </Badge>
            <h1
              className="text-2xl md:text-3xl font-heading font-bold tracking-tight"
            >
              Not Authorized
            </h1>
            <p className="text-xs md:text-sm leading-relaxed">
              You are not authorized to access this feature. Lumen AI is reserved for workspace owners and managers.
            </p>
          </div>

          <div className="pt-2">
            <Link to="/">
              <Button
                variant="outline"
                className="w-full h-11 border-[#E5DCCB] rounded-2xl text-[#8C7654] hover:bg-[#C5A880]/15 hover:text-[#2C241B] font-bold text-xs uppercase tracking-wider transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setActiveRoutedModel(null);
    setMessages([{
      id: 'init',
      role: 'assistant',
      content: `What are we building, fixing, or optimizing today?`,
      timestamp: new Date()
    }]);
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    localStorage.setItem('Lumen_selected_model', modelId);
    const found = AVAILABLE_MODELS.find(m => m.id === modelId);
    if (found && modelId !== 'auto') {
      setActiveRoutedModel(found);
    } else {
      setActiveRoutedModel(null);
    }
  };

  const handleDeleteSession = async (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (!user) return;

    const sessionDate = new Date(sessionId).toDateString();

    const { data: sessionMessages } = await supabase
      .from('ai_chat_messages')
      .select('id, created_at')
      .eq('user_id', user.id);

    if (sessionMessages) {
      const idsToDelete = sessionMessages
        .filter(msg => new Date(msg.created_at).toDateString() === sessionDate)
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

  const promptDeleteSession = (session: ChatSession, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSessionToDelete(session);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    const sessionId = sessionToDelete.id;
    setDeleteConfirmOpen(false);
    setSessionToDelete(null);
    await handleDeleteSession(sessionId);
  };

  const handleOpenShareCurrent = () => {
    const activeMessages = messages.filter(m => m.id !== 'init');
    if (activeMessages.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Empty conversation',
        description: 'Start chatting before sharing the conversation.'
      });
      return;
    }

    const firstUserMsg = activeMessages.find(m => m.role === 'user');
    const defaultTitle = firstUserMsg
      ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '')
      : 'Lumen AI Conversation';

    setShareChatTitle(defaultTitle);
    setShareChatMessages(messages);
    setShareDialogOpen(true);
  };

  const handleOpenShareSession = async (session: ChatSession, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) return;

    if (currentSessionId === session.id) {
      handleOpenShareCurrent();
      return;
    }

    // Load messages specifically for this session
    const { data, error } = await supabase
      .from('ai_chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error || !data) {
      toast({
        variant: 'destructive',
        title: 'Failed to prepare share',
        description: 'Could not load messages for this conversation.'
      });
      return;
    }

    const sessionDate = new Date(session.id).toDateString();
    const sessionMessages = data.filter(msg =>
      new Date(msg.created_at).toDateString() === sessionDate
    );

    const history: Message[] = sessionMessages.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: new Date(m.created_at)
    }));

    if (history.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Empty chat',
        description: 'No messages found to share.'
      });
      return;
    }

    setShareChatTitle(session.title);
    setShareChatMessages(history);
    setShareDialogOpen(true);
  };

  const executePrompt = async (cleanPrompt: string, originalInputForTitle?: string) => {
    setIsLoading(true);
    isAtBottomRef.current = true;
    setShowScrollButton(false);
    setTimeout(() => scrollToBottom(true), 40);

    try {
      const history = messages
        .filter(m => m.id !== 'init' && !m.isError)
        .slice(-20)
        .map(m => {
          const parsed = parseSkillCommand(m.content);
          return { role: m.role, content: parsed.cleanedInput || m.content };
        });

      const { data: { session } } = await supabase.auth.getSession();

      // Check for skills (/code, /reason, /fast, /smart)
      const { skill } = parseSkillCommand(originalInputForTitle || cleanPrompt);

      // Model determination & smart token routing
      let targetModel: AIModelConfig;
      let fallbackModel: AIModelConfig | null = null;
      let routedReason: string | undefined = undefined;

      if (skill) {
        if (skill.targetModelId === 'auto') {
          const decision = routeQuery(cleanPrompt, history);
          targetModel = decision.targetModel;
          fallbackModel = decision.fallbackModel;
          routedReason = decision.reason;
        } else {
          targetModel = AVAILABLE_MODELS.find(m => m.id === skill.targetModelId) || DEFAULT_MODEL;
          fallbackModel = targetModel.provider === 'gemini'
            ? (AVAILABLE_MODELS.find(m => m.id === 'openrouter-free') || null)
            : DEFAULT_MODEL;
          routedReason = `Skill: ${skill.name} (${skill.command})`;
        }
        setActiveRoutedModel(targetModel);
        setStatusMessage(`Skill ${skill.command}: Invoking ${targetModel.shortName}...`);
      } else if (selectedModelId === 'auto') {
        const decision = routeQuery(cleanPrompt, history);
        targetModel = decision.targetModel;
        fallbackModel = decision.fallbackModel;
        routedReason = decision.reason;
        setActiveRoutedModel(targetModel);
        setStatusMessage(`Smart Router: Querying ${targetModel.shortName}...`);
      } else {
        targetModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || DEFAULT_MODEL;
        fallbackModel = targetModel.provider === 'gemini'
          ? (AVAILABLE_MODELS.find(m => m.id === 'openrouter-free') || null)
          : DEFAULT_MODEL;
        setActiveRoutedModel(targetModel);
        setStatusMessage(`Querying ${targetModel.shortName}...`);
      }

      // Pure clean prompt sent to model without any /code, /reason, /fast, /smart command prefixes
      const promptPayload = cleanPrompt;

      const callModelApi = async (modelToRun: AIModelConfig) => {
        const endpoint = modelToRun.endpoint;
        return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: promptPayload,
            history,
            model: modelToRun.modelIdentifier
          })
        });
      };

      let response: Response;
      let activeModel = targetModel;
      let wasFallback = false;

      try {
        response = await callModelApi(targetModel);
      } catch (networkErr: any) {
        if (fallbackModel && fallbackModel.id !== targetModel.id) {
          console.warn(`[AiAgent] Network error with ${targetModel.name}. Rerouting to ${fallbackModel.name}`);
          toast({
            title: "Auto-Rerouting Query",
            description: `Unable to reach ${targetModel.shortName}. Seamlessly rerouting to ${fallbackModel.shortName}...`
          });
          activeModel = fallbackModel;
          wasFallback = true;
          setStatusMessage(`Rerouted to ${fallbackModel.shortName}...`);
          response = await callModelApi(fallbackModel);
        } else {
          throw networkErr;
        }
      }

      if (!response.ok && fallbackModel && fallbackModel.id !== targetModel.id) {
        let isRateLimitOrDown = response.status === 429 || response.status === 502 || response.status === 503;
        let errorDataText = '';
        try {
          const errorData = await response.json();
          errorDataText = errorData.error || '';
          if (
            errorDataText.toLowerCase().includes('rate limit') ||
            errorDataText.toLowerCase().includes('quota') ||
            errorDataText.toLowerCase().includes('speed cap') ||
            errorDataText.toLowerCase().includes('slow down') ||
            errorDataText.toLowerCase().includes('overloaded')
          ) {
            isRateLimitOrDown = true;
          }
        } catch (e) {
          // ignore json parse error
        }

        if (isRateLimitOrDown) {
          console.warn(`[AiAgent] Speed cap / limit detected on ${targetModel.name}. Rerouting to fallback: ${fallbackModel.name}`);
          toast({
            title: "Speed Cap Prevented",
            description: `${targetModel.shortName} hit rate limit. Seamlessly answered via ${fallbackModel.shortName} to save tokens.`
          });
          activeModel = fallbackModel;
          wasFallback = true;
          setStatusMessage(`Rerouting to ${fallbackModel.shortName}...`);
          response = await callModelApi(fallbackModel);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to communicate with ${activeModel.name}`);
      }

      if (!response.body) throw new Error('No stream available');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let isFirstChunk = true;
      const assistantMsgId = (Date.now() + 1).toString();

      let fullContent = '';
      let rafId: number | null = null;
      let lastRenderTime = 0;

      const scheduleRender = () => {
        const now = performance.now();
        // 30ms throttle provides ~33fps DOM updates, completely eliminating CPU lag and jitter
        if (now - lastRenderTime > 30) {
          lastRenderTime = now;
          setMessages(prev => prev.map(m =>
            m.id === assistantMsgId ? { ...m, content: fullContent } : m
          ));
          if (isAtBottomRef.current && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
          }
        } else if (!rafId) {
          rafId = requestAnimationFrame(() => {
            rafId = null;
            lastRenderTime = performance.now();
            setMessages(prev => prev.map(m =>
              m.id === assistantMsgId ? { ...m, content: fullContent } : m
            ));
            if (isAtBottomRef.current && scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
          });
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let hasNewTokens = false;

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
                    isStreaming: true,
                    model: activeModel.shortName,
                    routedReason: selectedModelId === 'auto' ? routedReason : undefined,
                    isFallback: wasFallback
                  }]);
                  isFirstChunk = false;
                  if (isAtBottomRef.current && scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
                  }
                }

                fullContent += textChunk;
                hasNewTokens = true;
              }
            } catch (e) {
              // Ignore incomplete JSON chunks
            }
          }
        }

        if (hasNewTokens) {
          scheduleRender();
        }
      }

      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      if (!fullContent.trim()) {
        throw new Error(`The model ${activeModel.shortName} ended without returning any content. Please retry.`);
      }

      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId
          ? {
            ...m,
            content: fullContent,
            isStreaming: false,
            model: activeModel.shortName,
            routedReason: selectedModelId === 'auto' ? routedReason : undefined,
            isFallback: wasFallback
          }
          : m
      ));

      if (isAtBottomRef.current && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }

      if (user && fullContent) {
        await supabase.from('ai_chat_messages').insert({
          user_id: user.id,
          role: 'assistant',
          content: fullContent
        });

        // Refresh sessions
        const newSessionId = new Date().toDateString();
        const titleSource = cleanPrompt;
        if (!chatSessions.find(s => s.id === newSessionId)) {
          setChatSessions(prev => [{
            id: newSessionId,
            title: titleSource.slice(0, 50) + (titleSource.length > 50 ? '...' : ''),
            preview: titleSource.slice(0, 80),
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
          ? `# **Whoa, Slow Down**\n\nYou've hit the rate limit for this model. Click **Retry** below to resend your prompt.`
          : `# **Error Generating Response**\n\n${errorMessage}`,
        timestamp: new Date(),
        isError: true,
        failedPrompt: cleanPrompt
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (input: string) => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // Check for skills (/code, /reason, /fast, /smart)
    const { skill, cleanedInput } = parseSkillCommand(trimmedInput);

    // Strip routing command prefix completely so neither user display nor model prompt contains /code, /reason, etc.
    const cleanPrompt = (skill ? cleanedInput : trimmedInput) || trimmedInput;
    if (!cleanPrompt) return;

    const userMsgId = Date.now().toString();
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: cleanPrompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);

    if (user) {
      await supabase.from('ai_chat_messages').insert({
        user_id: user.id,
        role: 'user',
        content: userMsg.content
      });
    }

    await executePrompt(cleanPrompt, trimmedInput);
  };

  const handleRetry = async (failedPrompt: string, errorMsgId: string) => {
    if (!failedPrompt || isLoading) return;

    // Remove the failed error message from conversation
    setMessages(prev => prev.filter(m => m.id !== errorMsgId));

    // Re-execute prompt directly without adding duplicate user message
    await executePrompt(failedPrompt);
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

  const activeMessages = messages.filter(m => m.id !== 'init');
  const isNewChat = activeMessages.length === 0;

  return (
    <div className="fixed inset-0 z-10 flex overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "flex-shrink-0 flex flex-col border-r border-[#E5DCCB]/30 bg-transparent backdrop-blur-xl transition-all duration-300 ease-out overflow-hidden",
        sidebarOpen ? "w-64" : "w-0"
      )}>
        <div className="flex flex-col h-full p-4 min-h-0 pt-4">
          {/* New Chat Button */}
          <Button
            onClick={handleNewChat}
            className="w-full rounded-[2em] mb-4 flex-shrink-0 bg-[#2C241B]/80 hover:opacity-90 text-white shadow-lg transition-all duration-300 h-12"
          >
            <RiChatAiFill className="w-5 h-5 mr-1" />
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
                    "group relative p-2 pl-3 rounded-2xl cursor-pointer transition-all duration-200",
                    currentSessionId === session.id
                      ? "bg-[#E4DCD3]  shadow-sm"
                      : "bg-transparent border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-sans text-[#2C241B] dark:text-white truncate  capitalize">
                        {session.title}
                      </h4>
                      {/* <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 mt-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{formatDate(session.timestamp)}</span>
                        <span className="ml-auto shrink-0">{session.messageCount} msgs</span>
                      </div> */}
                    </div>
                    <div className="flex items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-[#2C241B] dark:hover:text-white shrink-0"
                            onClick={(e) => e.stopPropagation()}
                            title="Chat options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                            <span className="sr-only">Chat options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-40 rounded-2xl bg-[#FDFDFB]/95 dark:bg-[#1E1C18]/95 backdrop-blur-xl border border-[#E5DCCB] dark:border-[#38322D] shadow-[0_15px_35px_rgba(197,168,128,0.18)] p-1.5 z-50 animate-in zoom-in-95 duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onClick={(e) => handleOpenShareSession(session, e)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold cursor-pointer rounded-xl hover:bg-[#FAF8F5] dark:hover:bg-[#2A2621] text-[#2C241B] dark:text-[#EFEAE2] transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5 text-[#8C7654]" />
                            <span>Share Chat</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => promptDeleteSession(session, e)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold cursor-pointer rounded-xl hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 focus:text-rose-600 focus:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Chat</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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

        {/* Top-Left Action Bar: Sidebar Toggle & Share Chat */}
        <div className="absolute top-3.5 left-3.5 z-30 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-full h-9 w-9 bg-white/80 dark:bg-[#1E1C18]/80 backdrop-blur-md border border-[#E5DCCB] dark:border-[#38322D] shadow-sm hover:bg-[#FAF8F5] text-[#2C241B] hover:text-[#2C241B] dark:text-[#EFEAE2] transition-transform active:scale-95"
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>

          {activeMessages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenShareCurrent}
              className="rounded-full h-9 px-3.5 bg-white/80 dark:bg-[#1E1C18]/80 backdrop-blur-md border border-[#E5DCCB] dark:border-[#38322D] shadow-sm hover:bg-[#FAF8F5] dark:hover:bg-[#2A2621] text-xs font-semibold text-[#2C241B] hover:text-[#2C241B] dark:text-[#EFEAE2] flex items-center gap-1.5 animate-in fade-in duration-200"
            >
              <Share2 className="w-3.5 h-3.5 text-[#8C7654]" />
              <span>Share</span>
            </Button>
          )}
        </div>

        <div className="relative z-10 flex-1 flex flex-col min-h-0">
          {/* Top fade — mirrors the bottom fade on ChatInput */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background to-transparent pointer-events-none z-20" />

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={cn(
              "flex-1 px-4 md:px-8 lg:px-32 xl:px-48 custom-scrollbar",
              isNewChat
                ? "flex flex-col justify-center items-center overflow-hidden pb-32 pt-8"
                : "overflow-y-auto pb-40 pt-16"
            )}
          >
            {isNewChat ? (
              <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto px-4 select-none animate-in fade-in zoom-in-95 duration-300 -mt-10">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#2C241B] to-[#4A3E31] text-[#EFEAE2] flex items-center justify-center shadow-xl border border-white/10">
                  <RiChatAiFill className="w-8 h-8 md:w-9 md:h-9 text-[#C5A880]" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-center leading-[1.15]">
                    <span className="block opacity-60 text-2xl md:text-3xl font-normal mb-1">{getGreeting()},</span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 font-sans font-semibold">
                      {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || ''}
                    </span>
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base font-normal max-w-md mx-auto leading-relaxed pt-1">
                    What are we building, fixing, or optimizing today?
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto space-y-8 w-full pb-8">
                {activeMessages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    user={user}
                    onRetry={handleRetry}
                    isLoading={isLoading}
                  />
                ))}

                {isLoading && !messages.some(m => m.isStreaming) && (
                  <div className="flex w-full justify-start mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex max-w-[85%] gap-4 flex-row items-end">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white dark:bg-zinc-900 border border-white/20 flex items-center justify-center shrink-0 shadow-2xl overflow-hidden">
                        <span className="text-[8px] font-sans font-bold uppercase tracking-widest text-[#8C7654]">Lumen</span>
                      </div>
                      <div className="px-6 py-4 rounded-[2.5rem] border border-white/20 flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 max-w-[280px] truncate">
                          {statusMessage}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Floating Scroll to Bottom Button (Grok / ChatGPT style) */}
          {showScrollButton && (
            <button
              type="button"
              onClick={() => scrollToBottom(true)}
              className="absolute bottom-28 right-6 md:right-10 z-30 bg-white/95 dark:bg-zinc-800/95 text-[#2C241B] dark:text-white border border-[#E5DCCB] dark:border-zinc-700 shadow-xl rounded-full p-2.5 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center backdrop-blur-md group animate-in fade-in slide-in-from-bottom-2"
              title="Scroll to latest message"
            >
              <ArrowDown className="w-4 h-4 text-[#8C7654] dark:text-amber-400 group-hover:translate-y-0.5 transition-transform" />
              {isLoading && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </button>
          )}

          <ChatInput
            onSubmit={handleSendMessage}
            isLoading={isLoading}
            selectedModelId={selectedModelId}
            onSelectModel={handleSelectModel}
            activeRoutedModel={selectedModelId === 'auto' ? activeRoutedModel : null}
          />
        </div>
      </div>

      <ShareChatDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title={shareChatTitle}
        messages={shareChatMessages}
        user={user}
      />

      {/* Delete Chat Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="!rounded-3xl border border-[#E5DCCB] dark:border-[#38322D] bg-[#FDFDFB] dark:bg-[#1C1A17] p-6 shadow-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-[#2C241B] dark:text-[#EFEAE2]">
              Delete Conversation?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed mt-2">
              Are you sure you want to delete <span className="font-semibold text-[#2C241B] dark:text-white">"{sessionToDelete?.title}"</span>? This will permanently remove all messages in this conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2 mt-4">
            <AlertDialogCancel className="rounded-full border-[#E5DCCB] dark:border-[#38322D] text-xs font-bold text-[#8C7654] hover:text-[#8C7654] hover:bg-[#C5A880]/10 px-5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSession}
              className="rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-5 shadow-sm transition-all"
            >
              Delete Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AiAgent;
