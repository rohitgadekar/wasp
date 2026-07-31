import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnlineUser {
  user_id: string;
  email: string;
  full_name: string;
}

export const OnlineUsers = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const { user } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Supabase Realtime Presence
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('online-users', {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();

        // Deduplicate users by taking the first presence object for each unique state key
        const users = Object.values(state)
          .map((presences: any) => presences[0])
          .filter(Boolean)
          .map((presence: any) => ({
            user_id: presence.user_id,
            email: presence.email,
            full_name: presence.full_name,
          })) as OnlineUser[];

        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', user.id)
            .single();

          await channel.track({
            user_id: user.id,
            email: profile?.email || user.email || 'unknown@example.com',
            full_name: profile?.full_name || 'Unknown User',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-[12rem] right-6 z-50 select-none">
      {/* Floating Button / Hub Trigger */}
      {!isOpen ? (
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/40 transition-all duration-500 animate-pulse" />
          <Button
            onClick={() => setIsOpen(true)}
            className="h-16 w-16 rounded-full glass-card border-white/20 dark:border-white/10 shadow-2xl relative flex items-center justify-center group-hover:scale-110 active:scale-95 transition-all duration-500"
            size="icon"
          >
            <Users className="h-7 w-7 text-primary group-hover:rotate-12 transition-transform duration-500" />
            {onlineUsers.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-black tracking-tighter text-primary-foreground shadow-lg shadow-primary/30 border-2 border-background animate-in zoom-in duration-500">
                {onlineUsers.length}
              </span>
            )}
          </Button>
        </div>
      ) : (
        /* Active Nodes Panel */
        <div ref={panelRef} className="animate-in slide-in-from-bottom-10 fade-in duration-500">
          <Card className="w-80 glass-card border-white/20 dark:border-white/10 overflow-hidden rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] backdrop-blur-3xl">
            <div className="flex items-center justify-between border-b border-white/10 p-6 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-md animate-pulse" />
                  <Users className="h-5 w-5 text-primary relative" />
                </div>
                <div className="flex flex-col">
                  <h1 className="font-black text-sm tracking-[0.1em] uppercase text-foreground/90">Operational Nodes</h1>
                  <span className="text-[10px] font-bold text-primary/60 tracking-widest uppercase">
                    Network Status: Verified
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-10 w-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 active:scale-90 transition-all"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

            <div className="max-h-[28rem] overflow-y-auto p-4 custom-scrollbar">
              {onlineUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 opacity-40">
                  <Users className="h-10 w-10 text-muted-foreground font-light" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Node Isolation Active</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {onlineUsers.map((onlineUser) => (
                    <div
                      key={onlineUser.user_id}
                      className="group flex items-center gap-4 rounded-2xl p-3 hover:bg-primary/5 transition-all duration-300 cursor-default"
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-white/10 shadow-lg group-hover:scale-105 transition-transform duration-500">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-xs font-black">
                            {getInitials(onlineUser.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-card animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black tracking-tight text-foreground/90 truncate">
                            {onlineUser.full_name}
                          </p>
                          {onlineUser.user_id === user?.id && (
                            <span className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">Self</span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground/60 truncate tracking-tight">
                          {onlineUser.email.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-primary/5 border-t border-white/10">
              <div className="flex items-center justify-center gap-2 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black tracking-[0.1em] uppercase text-muted-foreground/50">
                  {onlineUsers.length} Active Synchronization {onlineUsers.length === 1 ? 'Node' : 'Nodes'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};