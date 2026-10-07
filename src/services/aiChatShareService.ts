import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/components/ai-agent/ChatMessage';

export interface SharedChatData {
  id: string;
  user_id?: string;
  title: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string | Date;
  }>;
  shared_by_name?: string;
  created_at: string;
  updated_at?: string;
}

// Fallback storage key for local development or before migration is executed
const LOCAL_SHARED_STORAGE_KEY = 'nyra_ai_shared_chats_cache';

const getLocalSharedChats = (): Record<string, SharedChatData> => {
  try {
    const raw = localStorage.getItem(LOCAL_SHARED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const saveLocalSharedChat = (chat: SharedChatData) => {
  try {
    const all = getLocalSharedChats();
    all[chat.id] = chat;
    localStorage.setItem(LOCAL_SHARED_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to save to local shared storage', e);
  }
};

export interface UserLike {
  id?: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    [key: string]: unknown;
  };
}

export const createOrUpdateSharedChat = async ({
  shareId,
  title,
  messages,
  user,
}: {
  shareId?: string;
  title: string;
  messages: Message[];
  user: UserLike | null;
}): Promise<{ shareId: string; isFallback: boolean; error?: string }> => {
  // Format clean messages payload
  const formattedMessages = messages
    .filter((m) => m.id !== 'init')
    .map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : new Date(m.timestamp).toISOString(),
    }));

  const sharedByName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Nyra Workspace Member';

  try {
    // Attempt Supabase insert/update
    if (shareId) {
      const { data, error } = await supabase
        .from('ai_shared_chats')
        .update({
          title,
          messages: formattedMessages,
          shared_by_name: sharedByName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', shareId)
        .eq('user_id', user.id)
        .select('id')
        .single();

      if (!error && data?.id) {
        return { shareId: data.id, isFallback: false };
      }
    } else {
      const { data, error } = await supabase
        .from('ai_shared_chats')
        .insert({
          user_id: user.id,
          title,
          messages: formattedMessages,
          shared_by_name: sharedByName,
          is_public: true,
        })
        .select('id')
        .single();

      if (!error && data?.id) {
        return { shareId: data.id, isFallback: false };
      }

      // Check if table missing
      if (error && (error.code === '42P01' || error.message?.includes('schema cache') || error.message?.includes('ai_shared_chats'))) {
        console.warn('ai_shared_chats table not found in Supabase. Using client storage fallback.');
      } else if (error) {
        console.error('Supabase error sharing chat:', error);
      }
    }
  } catch (err) {
    console.warn('Supabase query failed, falling back to local/URL sharing:', err);
  }

  // Graceful Fallback if DB table doesn't exist yet
  const fallbackId = shareId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `share_${Date.now()}`);
  const fallbackRecord: SharedChatData = {
    id: fallbackId,
    user_id: user?.id,
    title,
    messages: formattedMessages,
    shared_by_name: sharedByName,
    created_at: new Date().toISOString(),
  };

  saveLocalSharedChat(fallbackRecord);
  return { shareId: fallbackId, isFallback: true };
};

export const getSharedChat = async (shareId: string): Promise<SharedChatData | null> => {
  // 1. Try Supabase
  try {
    const { data, error } = await supabase
      .from('ai_shared_chats')
      .select('*')
      .eq('id', shareId)
      .single();

    if (!error && data) {
      return {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        messages: Array.isArray(data.messages) ? data.messages : [],
        shared_by_name: data.shared_by_name,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }
  } catch (e) {
    // ignore and check fallback
  }

  // 2. Check local fallback
  const local = getLocalSharedChats();
  if (local[shareId]) {
    return local[shareId];
  }

  return null;
};

export const deleteSharedChat = async (shareId: string, userId: string): Promise<boolean> => {
  try {
    await supabase
      .from('ai_shared_chats')
      .delete()
      .eq('id', shareId)
      .eq('user_id', userId);
  } catch (e) {
    // continue
  }

  try {
    const all = getLocalSharedChats();
    delete all[shareId];
    localStorage.setItem(LOCAL_SHARED_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    // continue
  }

  return true;
};
