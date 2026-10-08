import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/components/ai-agent/ChatMessage';
import {
  createOrUpdateSharedChat,
  deleteSharedChat,
  UserLike,
} from '@/services/aiChatShareService';
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Trash2,
  Globe,
  Sparkles,
  Loader2,
  MessageSquare,
} from 'lucide-react';

interface ShareChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  messages: Message[];
  user: UserLike | null;
  currentShareId?: string | null;
  onShareCreated?: (shareId: string) => void;
}

export const ShareChatDialog: React.FC<ShareChatDialogProps> = ({
  open,
  onOpenChange,
  title: initialTitle,
  messages,
  user,
  currentShareId: propShareId,
  onShareCreated,
}) => {
  const [shareTitle, setShareTitle] = useState(initialTitle || 'Nyra AI Conversation');
  const [shareId, setShareId] = useState<string | null>(propShareId || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (initialTitle) {
      setShareTitle(initialTitle);
    }
    if (propShareId) {
      setShareId(propShareId);
    }
  }, [initialTitle, propShareId]);

  const activeMessages = messages.filter((m) => m.id !== 'init');
  const shareUrl = shareId ? `${window.location.origin}/ai-agent/share/${shareId}` : '';

  const handleCreateOrUpdate = async () => {
    if (activeMessages.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Empty conversation',
        description: 'Cannot share an empty conversation. Start chatting first.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await createOrUpdateSharedChat({
        shareId: shareId || undefined,
        title: shareTitle.trim() || 'Nyra AI Conversation',
        messages,
        user,
      });

      setShareId(result.shareId);
      onShareCreated?.(result.shareId);

      const url = `${window.location.origin}/ai-agent/share/${result.shareId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);

      toast({
        title: shareId ? 'Link updated & copied!' : 'Share link created & copied!',
        description: 'Anyone with this link can now view this chat.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error sharing chat',
        description: err.message || 'Something went wrong.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast({
        title: 'Copied to clipboard',
        description: 'Share link copied successfully.',
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: 'Please copy the link manually from the input.',
      });
    }
  };

  const handleDelete = async () => {
    if (!shareId || !user?.id) return;
    setIsGenerating(true);
    try {
      await deleteSharedChat(shareId, user.id);
      setShareId(null);
      toast({
        title: 'Share link removed',
        description: 'This chat is no longer publicly shared.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to revoke link',
        description: err.message || 'Something went wrong.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] rounded-3xl border border-[#E5DCCB] bg-[#FAF8F5] dark:bg-[#1C1A17] dark:border-[#38322D] shadow-[0_25px_70px_rgba(44,36,27,0.2)] p-6 gap-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#C5A880]/15 flex items-center justify-center text-[#8C7654]">
              <Share2 className="w-4 h-4" />
            </div>
            <DialogTitle className="text-xl font-heading font-semibold text-[#2C241B] dark:text-white">
              Share link to Chat
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Messages you send after creating your link won't be shared automatically. Anyone with the link will be able to view this conversation snapshot.
          </DialogDescription>
        </DialogHeader>

        {/* Conversation Preview Card */}
        <div className="rounded-2xl border border-[#E5DCCB]/70 dark:border-[#332E28] bg-white/70 dark:bg-[#25221E] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium">
              <MessageSquare className="w-3.5 h-3.5 text-[#8C7654]" />
              <span>Conversation Preview</span>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-[#E5DCCB] dark:border-[#38322D]">
              {activeMessages.length} {activeMessages.length === 1 ? 'Message' : 'Messages'}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#8C7654]">
              Chat Title
            </label>
            <Input
              value={shareTitle}
              onChange={(e) => setShareTitle(e.target.value)}
              placeholder="Give this chat a title"
              className="h-10 text-sm rounded-xl border-[#E5DCCB] dark:border-[#3A3530] bg-white dark:bg-[#1A1816] focus-visible:ring-[#C5A880]"
            />
          </div>

          {activeMessages.length > 0 && (
            <div className="text-xs text-muted-foreground/80 line-clamp-2 italic bg-[#F7F4EE] dark:bg-[#1E1C19] p-2.5 rounded-xl border border-[#EFEAE2]/60 dark:border-transparent">
              "{activeMessages[0]?.content.slice(0, 160)}"
            </div>
          )}
        </div>

        {/* Link Section */}
        {shareId ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <Globe className="w-3.5 h-3.5" /> Public link active
              </span>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8C7654] hover:underline flex items-center gap-1 font-medium"
              >
                <span>Preview page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="h-11 font-mono text-xs rounded-xl border-[#E5DCCB] dark:border-[#3A3530] bg-white dark:bg-[#1A1816]"
              />
              <Button
                onClick={handleCopy}
                className="h-11 px-4 rounded-xl bg-[#2C241B] dark:bg-[#EFEAE2] text-white dark:text-[#2C241B] hover:opacity-90 font-medium shrink-0 flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </Button>
            </div>

            {/* Actions: Update / Delete */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateOrUpdate}
                disabled={isGenerating}
                className="rounded-xl border-[#E5DCCB] dark:border-[#38322D] text-xs font-medium h-9 text-[#5C5040] dark:text-[#C5A880]"
              >
                {isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                )}
                Update link to latest
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isGenerating}
                className="rounded-xl text-xs font-medium h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Revoke link
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#C5A880]/10 border border-[#C5A880]/20 p-3.5 flex items-start gap-3">
              <p className="text-xs text-[#5C5040] dark:text-[#D4C3AB] leading-relaxed">
                Click below to generate a shareable link. Anyone with the link will be able to read this chat.
              </p>
            </div>

            <Button
              onClick={handleCreateOrUpdate}
              disabled={isGenerating || activeMessages.length === 0}
              className="w-full h-11 rounded-2xl bg-[#2C241B] hover:bg-[#38322D] text-white shadow-lg font-medium tracking-wide flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating link...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Create Share Link
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
