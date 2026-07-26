import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useTitle } from '@/hooks/use-title';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Copy, Share2, Edit, Trash2, Search, Loader2, CircleUser, Diff, Code2, Library, Terminal, Sparkles, Wand2, X, Cpu, Tag, FilePlusIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { GiFire } from "react-icons/gi";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Users } from 'lucide-react';

interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  profiles?: {
    email: string;
    full_name: string;
    avatar?: string | null;
  };
}

const PAGE_SIZE = 10;

// Separate form component — this is the key fix for lag when typing
const SnippetFormDialogContent = ({
  editingSnippet,
  onSubmit,
  onCancel,
  isLoading,
}: {
  editingSnippet: CodeSnippet | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    language: 'java',
    tags: '',
  });

  useEffect(() => {
    if (editingSnippet) {
      setFormData({
        title: editingSnippet.title,
        description: editingSnippet.description || '',
        code: editingSnippet.code,
        language: editingSnippet.language,
        tags: editingSnippet.tags.join(', '),
      });
    } else {
      setFormData({
        title: '',
        description: '',
        code: '',
        language: 'java',
        tags: '',
      });
    }
  }, [editingSnippet]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    onSubmit({
      title: formData.title,
      description: formData.description,
      code: formData.code,
      language: formData.language,
      tags: tagsArray,
    });
  };

  const inputClasses = "h-12 pl-11 pr-4 bg-white/40 border border-[#E3DAC9] rounded-md font-sans text-sm text-[#2C241B] placeholder:text-[#A59582]/30 focus-visible:ring-1 focus-visible:ring-[#C5A880] focus-visible:border-[#C5A880] transition-all";
  const labelClasses = "text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#8C7654] ml-1 mb-1.5 block";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-6 pb-6">
      <div className="grid gap-2">
        <Label htmlFor="title" className={labelClasses}>Snippet Identifier</Label>
        <div className="relative group/field">
          <Library className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A59582] group-focus-within/field:text-[#8C7654] transition-colors" />
          <Input
            id="title"
            placeholder="e.g. ROBUST JAVA FORMATTER"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={cn(inputClasses, "")}
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description" className={labelClasses}>Operational Scope</Label>
        <div className="relative group/field">
          <Terminal className="absolute left-4 top-3.5 w-4 h-4 text-[#A59582] group-focus-within/field:text-[#8C7654] transition-colors" />
          <Textarea
            id="description"
            placeholder="Describe the logic unit's functionality..."
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="pl-11 pr-4 py-3 rounded-md border border-[#E3DAC9] bg-white/40 focus-visible:ring-0 focus-visible:ring-[#C5A880] focus-visible:border-2 focus-visible:border-[#C5A880] font-sans text-sm text-[#2C241B] placeholder:text-[#A59582]/30 leading-relaxed resize-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="grid gap-2">
          <Label htmlFor="language" className={labelClasses}>Engine Syntax</Label>
          <div className="relative group/field">
            <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A59582] group-focus-within/field:text-[#8C7654] transition-colors" />
            <Input
              id="language"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              placeholder="java, typescript"
              className={cn(inputClasses, "")}
              required
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tags" className={labelClasses}>Categorization Tags</Label>
          <div className="relative group/field">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A59582] group-focus-within/field:text-[#8C7654] transition-colors" />
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="utility, helper"
              className={cn(inputClasses, "")}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="code" className={labelClasses}>Core Logic Node</Label>
          {formData.language && (
            <span className="text-[9px] font-sans font-bold tracking-[0.2em] uppercase text-[#C5A880]/80 mr-1">
              {formData.language}
            </span>
          )}
        </div>

        {/* Editor Panel */}
        <div className="rounded-md border border-[#E3DAC9] overflow-hidden bg-white/40 focus-within:border-[#C5A880] transition-all">
          {/* Textarea Input */}
          <div className="relative group/field">
            <Code2 className="absolute left-4 top-3.5 w-4 h-4 text-[#A59582] group-focus-within/field:text-[#8C7654] transition-colors z-10" />
            <Textarea
              id="code"
              rows={8}
              className="pl-11 pr-4 py-3 w-full bg-transparent border-none focus-visible:ring-0 focus-visible:outline-none font-mono text-sm text-[#2C241B] placeholder:text-[#A59582]/30 leading-relaxed resize-none transition-all"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              placeholder="Paste raw block logic here..."
            />
          </div>

          {/* Divider with Live Preview label */}
          {formData.code && (
            <>
              <div className="relative flex items-center px-4 py-1.5 bg-[#FAF9F5] border-t border-[#E3DAC9]">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E3DAC9] to-transparent" />
                <span className="mx-3 text-[8px] font-sans font-bold tracking-[0.3em] uppercase text-[#C5A880] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] animate-pulse inline-block" />
                  Live Preview
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-[#E3DAC9] via-transparent to-transparent" />
              </div>

              {/* Syntax Highlighted Preview */}
              <div className="border-t border-[#E3DAC9]/0">
                <SyntaxHighlighter
                  language={formData.language || 'text'}
                  style={oneLight}
                  showLineNumbers
                  wrapLines={true}

                  wrapLongLines={true}
                  customStyle={{
                    margin: 0,
                    padding: '0.75rem 1rem',
                    fontSize: '0.8125rem',
                    background: '#FDFDFB',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    borderRadius: 0,
                  }}
                  lineNumberStyle={{
                    color: '#C5A880',
                    opacity: 0.6,
                    fontSize: '0.75rem',
                    minWidth: '2.5em',
                  }}
                >
                  {formData.code}
                </SyntaxHighlighter>
              </div>
            </>
          )}
        </div>
      </div>
    </form>
  );
};

const DebouncedSearchBar = ({ value, onChange, onClear }: { value: string, onChange: (val: string) => void, onClear?: () => void }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    if (value === '') {
      setLocalValue('');
    }
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, onChange, value]);

  return (
    <div className="relative bg-[#FDFDFB] rounded-[2rem] border border-[#E5DCCB] shadow-[0_15px_30px_rgba(197,168,128,0.1)] transition-all duration-500 focus-within:border-[#C5A880] focus-within:shadow-[0_20px_40px_rgba(197,168,128,0.2)] overflow-hidden">
      <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A59582] group-focus-within:text-[#C5A880] transition-colors z-10" />
      <Input
        placeholder="Search code snippets..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="bg-transparent pl-14 pr-14 h-16 text-lg border-none focus-visible:ring-0 focus-visible:ring-offset-0 outline-none w-full font-sans text-[#2C241B] placeholder:text-[#A59582]/50"
      />
      {(localValue) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setLocalValue('');
            onChange('');
            if (onClear) onClear();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 text-[#8C7654] hover:bg-[#C5A880]/15 hover:text-[#2C241B] transition-all active:scale-95"
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

const CodeLibrary = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<CodeSnippet | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [snippetToDeleteId, setSnippetToDeleteId] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');

  useTitle('Code Library', 'Browse and manage reusable code snippets');

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const { data: snippetsData = { data: [], count: 0 }, isLoading: loading } = useQuery({
    queryKey: ['code_snippets', searchQuery, currentPage, selectedAuthor],
    queryFn: async () => {
      let q = supabase
        .from('code_snippets')
        .select(`*, profiles (email, full_name, avatar)`, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);

      if (searchQuery) {
        q = q.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (selectedAuthor !== 'all') {
        q = q.eq('author_id', selectedAuthor);
      }

      const { data, count, error } = await q;
      if (error) throw error;
      return { data: data as CodeSnippet[], count: count || 0 };
    },
  });

  const snippets = snippetsData.data;
  const totalCount = snippetsData.count;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const { data: isSuperUser = false } = useQuery({
    queryKey: ['user_role', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user?.id).single();
      return data?.role === 'owner' || data?.role === 'moderator';
    },
    enabled: !!user,
  });

  // Fetch all unique contributors (not limited by pagination)
  const { data: contributorsData = [] } = useQuery({
    queryKey: ['code_contributors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('code_snippets')
        .select('author_id, profiles(full_name, email)');
      if (error) throw error;

      // Get unique contributors
      const uniqueContributors = Array.from(
        new Map(data.map((item: any) => [item.author_id, item])).values()
      );
      return uniqueContributors;
    },
    enabled: !searchQuery && selectedAuthor === 'all',
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('code_snippets_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'code_snippets' }, () => queryClient.invalidateQueries({ queryKey: ['code_snippets'] })).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const handleSubmit = async (formData: any) => {
    setActionLoading('submit');
    try {
      if (editingSnippet) {
        await supabase.from('code_snippets').update(formData).eq('id', editingSnippet.id);
        toast({ title: 'Snippet updated successfully!' });
      } else {
        await supabase.from('code_snippets').insert([{ ...formData, author_id: user?.id }]);
        toast({ title: 'Snippet created successfully!' });
      }
      queryClient.invalidateQueries({ queryKey: ['code_snippets'] });
      setIsAddDialogOpen(false);
      setEditingSnippet(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (snippet: CodeSnippet) => {
    setEditingSnippet(snippet);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setSnippetToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!snippetToDeleteId) return;
    setActionLoading(snippetToDeleteId);
    await supabase.from('code_snippets').delete().eq('id', snippetToDeleteId);
    toast({ title: 'Snippet deleted successfully!' });
    queryClient.invalidateQueries({ queryKey: ['code_snippets'] });
    setActionLoading(null);
    setSnippetToDeleteId(null);
    setIsDeleteDialogOpen(false);
  };

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast({ title: 'Code copied to clipboard!' });
  };

  const handleShare = async (snippet: CodeSnippet) => {
    await navigator.clipboard.writeText(`${window.location.origin}/s/${snippet.id}`);
    toast({ title: 'Share link copied!' });
  };

  const canEdit = (snippet: CodeSnippet) => isSuperUser || snippet.author_id === user?.id;

  return (
    <div className="relative min-h-screen">
      <div className="relative space-y-16 mx-auto p-6 md:p-12 max-w-[1400px] py-20 z-10">
        <div className="text-center flex flex-col items-center justify-center space-y-8">
          <Badge className="bg-[#C5A880]/10 text-[#8C7654] border border-[#E5DCCB] rounded-full px-6 py-1.5 uppercase tracking-[0.3em] text-[10px] font-sans font-bold mx-auto block w-fit shadow-sm">
            Code Repository
          </Badge>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-center w-full">
          <div className="group relative flex-1 w-full">
            <DebouncedSearchBar value={searchQuery} onChange={setSearchQuery} onClear={() => setSelectedAuthor('all')} />
          </div>

          <Dialog modal={false} open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) setEditingSnippet(null); }}>
            <DialogTrigger asChild>
              <Button className="rounded-[2rem] hidden px-10 h-16 bg-[#2C241B] hover:bg-[#38322D] text-[#EFEAE2] font-sans font-bold tracking-[0.15em] text-xs uppercase shadow-xl hover:-translate-y-1 active:scale-95 group transition-all shrink-0">
                <Plus className="mr-3 h-5 w-5 transition-transform group-hover:rotate-90 text-[#C5A880]" />
                Add Snippet
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#FDFDFB] border-0 border-[#E5DCCB] rounded-[2rem] p-0 max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-[0_40px_100px_rgba(44,36,27,0.15)]">
              {/* Gradient Header Band */}
              <div className="relative flex-shrink-0 bg-gradient-to-br from-[#2C241B] via-[#3D3125] to-[#2C241B] px-8 pt-8 pb-6 overflow-hidden">
                {/* Subtle ambient glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#C5A880]/5 rounded-full blur-2xl pointer-events-none" />
                {/* Fine dot pattern */}
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23C5A880'/%3E%3C/svg%3E")` }} />
                <div className="relative z-10 flex items-start gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-sans font-bold tracking-[0.3em] uppercase text-[#C5A880]/70 mb-1">
                      {editingSnippet ? 'Refining' : 'Adding'}
                    </div>
                    <DialogTitle className="text-2xl font-sans font-semibold text-[#EFEAE2] tracking-wide leading-tight">
                      {editingSnippet ? 'Code Snippet' : 'New Code Snippet'}
                    </DialogTitle>
                  </div>
                </div>
                {/* Gold accent line at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C5A880]/50 to-transparent" />
              </div>

              {/* Form Body */}
              <div className="flex-1 overflow-y-auto px-8 custom-scrollbar bg-[#FDFDFB]">
                <SnippetFormDialogContent editingSnippet={editingSnippet} onSubmit={handleSubmit} onCancel={() => { setIsAddDialogOpen(false); setEditingSnippet(null); }} isLoading={actionLoading === 'submit'} />
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-8 py-5 bg-[#FAF9F5] border-t border-[#E5DCCB] flex items-center justify-between">
                <span className="text-[9px] font-sans font-bold tracking-[0.25em] uppercase text-[#A59582]">
                  Eagle Labs Infrastructure
                </span>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 px-6 rounded-lg font-sans font-bold uppercase text-[10px] tracking-[0.15em] text-[#8C7654] hover:text-[#2C241B] hover:bg-[#E5DCCB]/40 transition-all"
                    onClick={() => { setIsAddDialogOpen(false); setEditingSnippet(null); }}
                  >
                    Discard
                  </Button>
                  <Button
                    type="submit"
                    className="h-10 px-8 rounded-lg bg-[#2C241B] hover:bg-[#38322D] text-[#EFEAE2] font-sans font-bold uppercase text-[10px] tracking-[0.15em] shadow-md border border-[#C5A880]/20 hover:border-[#C5A880]/50 transition-all hover:scale-105 active:scale-95"
                    disabled={actionLoading === 'submit'}
                    onClick={() => document.querySelector('form')?.requestSubmit()}
                  >
                    {actionLoading === 'submit' && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-[#C5A880]" />}
                    {editingSnippet ? 'Sync Update' : 'Establish Node'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-8">
          {loading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => <div key={i} className="h-64 rounded-3xl bg-[#E5DCCB]/20 animate-pulse border border-[#E5DCCB]/50" />)}
            </div>
          ) : !searchQuery && selectedAuthor === 'all' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Library Statistics */}
              <div className="flex items-center gap-4 px-2">
                <p className="text-sm font-sans font-bold uppercase tracking-widest text-[#8C7654] mt-1">Library Overview</p>
                <div className="h-px flex-1 bg-gradient-to-r from-[#E5DCCB] to-transparent" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Snippets */}
                <Card className="bg-[#2C241B] rounded-3xl border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 flex items-center justify-center">
                        <Code2 className="w-5 h-5 text-[#C5A880]" />
                      </div>
                      <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#C5A880]/70">Total Snippets</span>
                    </div>
                    <div className="text-4xl font-sans font-bold text-[#EFEAE2]">{totalCount}</div>
                  </div>
                </Card>

                {/* Languages */}
                <Card className="bg-[#FDFDFB] rounded-3xl border border-[#E5DCCB] overflow-hidden group hover:shadow-xl hover:border-[#C5A880]/50 transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#C5A880]/10 flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-[#8C7654]" />
                      </div>
                      <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#A59582]">Languages</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set(snippets.map(s => s.language))).slice(0, 3).map(lang => (
                        <Badge key={lang} className="bg-[#C5A880]/15 text-[#8C7654] border-none px-2.5 py-0.5 rounded-full text-[9px] font-sans font-bold tracking-wider uppercase">
                          {lang}
                        </Badge>
                      ))}
                      {Array.from(new Set(snippets.map(s => s.language))).length > 3 && (
                        <span className="text-[10px] font-sans text-[#A59582]">+{Array.from(new Set(snippets.map(s => s.language))).length - 3}</span>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Contributors */}
                <Card className="bg-[#FDFDFB] rounded-3xl border border-[#E5DCCB] overflow-hidden group hover:shadow-xl hover:border-[#C5A880]/50 transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#C5A880]/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#8C7654]" />
                      </div>
                      <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#A59582]">Contributors</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {contributorsData.slice(0, 4).map((contributor: any) => {
                        const name = contributor?.profiles?.full_name || contributor?.profiles?.email?.split('@')[0] || 'Unknown';
                        return (
                          <Badge
                            key={contributor.author_id}
                            className="bg-[#C5A880]/15 text-[#8C7654] border-none px-2.5 py-0.5 rounded-full text-[8px] font-sans font-bold tracking-wider"
                          >
                            {name}
                          </Badge>
                        );
                      })}
                      {contributorsData.length > 4 && (
                        <Badge className="bg-[#FAF9F5] text-[#A59582] border border-[#E5DCCB] px-2.5 py-0.5 rounded-full text-[9px] font-sans font-bold tracking-wider">
                          +{contributorsData.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-gradient-to-br from-[#C5A880]/10 to-[#A8896A]/10 rounded-3xl border border-[#C5A880]/30 overflow-hidden group hover:shadow-xl hover:border-[#C5A880]/60 transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 flex items-center justify-center">
                        <GiFire className="w-5 h-5 text-[#8C7654]" />
                      </div>
                      <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#A59582]">Quick Actions</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 rounded-lg bg-white/50 text-[#8C7654] hover:bg-white hover:text-[#2C241B] text-[10px] font-sans font-bold uppercase tracking-wider"
                        onClick={() => setIsAddDialogOpen(true)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        New
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 rounded-lg bg-white/50 text-[#8C7654] hover:bg-white hover:text-[#2C241B] text-[10px] font-sans font-bold uppercase tracking-wider"
                        onClick={() => document.querySelector('input')?.focus()}
                      >
                        <Search className="w-3.5 h-3.5 mr-1.5" />
                        Search
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : snippets.length === 0 ? (
            <Card className="bg-[#FAF9F5] border border-dashed border-[#E5DCCB] rounded-[2rem] shadow-none">
              <CardContent className="py-24 text-center">
                <div className="bg-[#C5A880]/10 border border-[#E5DCCB] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-10 w-10 text-[#C5A880]" />
                </div>
                <h3 className="text-2xl font-inter font-semibold tracking-wide text-[#2C241B] mb-2">Void in the Archive</h3>
                <p className="text-[#7A6E5D] font-serif italic text-lg max-w-sm mx-auto">
                  {totalCount === 0
                    ? "We couldn't find any logic units matching your current parameters."
                    : "There are no architectural blueprints on this page."}
                </p>
                {(searchQuery || selectedAuthor !== 'all') && (
                  <Button variant="link" onClick={() => { setSearchQuery(''); setSelectedAuthor('all'); }} className="mt-6 text-[#8C7654] font-sans font-bold uppercase tracking-widest text-[10px] hover:text-[#2C241B]">
                    Clear Search Parameters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            snippets.map((snippet) => (
              <Card key={snippet.id} className="bg-[#FDFDFB] rounded-[2.5rem] border-[#E5DCCB] hover:border-[#C5A880]/50 transition-all duration-500 hover:shadow-2xl hover:shadow-[#C5A880]/10 group overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className="bg-[#C5A880]/15 text-[#8C7654] border-none px-3.5 py-1 rounded-full text-[9px] font-sans font-bold tracking-[0.2em] uppercase">
                          {snippet.language}
                        </Badge>
                        <div className="h-1 w-1 rounded-full bg-[#E5DCCB]" />
                        <span className="text-[10px] font-sans font-bold text-[#A59582] uppercase tracking-[0.15em]">
                          {format(snippet.created_at, 'MMMM d, yyyy')}
                        </span>
                      </div>
                      <CardTitle className="text-3xl md:text-4xl font-sans font-semibold  text-[#2C241B] mb-3 group-hover:text-[#94764D] transition-colors">
                        {snippet.title}
                      </CardTitle>
                      {snippet.description && (
                        <CardDescription className="text-lg font-sans text-[#7A6E5D] leading-relaxed line-clamp-2">
                          {snippet.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button size="icon" variant="ghost" className="rounded-full h-11 w-11 bg-[#FAF9F5] border border-[#E5DCCB]/60 text-[#8C7654] hover:bg-[#C5A880]/15 hover:text-[#2C241B]" onClick={() => handleCopy(snippet.code)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="rounded-full h-11 w-11 bg-[#FAF9F5] border border-[#E5DCCB]/60 text-[#8C7654] hover:bg-[#C5A880]/15 hover:text-[#2C241B]" onClick={() => handleShare(snippet)}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                      {canEdit(snippet) && (
                        <>
                          <Button size="icon" variant="ghost" className="rounded-full h-11 w-11 bg-[#FAF9F5] border border-[#E5DCCB]/60 text-[#8C7654] hover:bg-[#C5A880]/15 hover:text-[#2C241B]" onClick={() => handleEdit(snippet)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-full h-11 w-11 bg-[#FAF9F5] border border-[#E5DCCB]/60 text-[#8C2B2B]/70 hover:bg-[#8C2B2B]/10 hover:text-[#8C2B2B]"
                            onClick={() => handleDelete(snippet.id)}
                            disabled={actionLoading === snippet.id}
                          >
                            {actionLoading === snippet.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-6">
                    {snippet.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="rounded-full px-4 py-1.5 text-[9px] font-sans font-bold uppercase tracking-widest border-[#E5DCCB] bg-[#FAF9F5] text-[#8C7654]">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <div className="relative rounded-md overflow-hidden bg-white border border-[#E5DCCB]/60">
                    <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge className="bg-[#FAF9F5]/80 backdrop-blur-md text-[#8C7654] border border-[#E5DCCB]/50 shadow-sm uppercase text-[8px] font-sans font-bold tracking-widest">
                        {snippet.language}
                      </Badge>
                    </div>
                    <SyntaxHighlighter
                      language={snippet.language}
                      style={oneLight}
                      showLineNumbers
                      wrapLines={true}
                      wrapLongLines={true}
                      customStyle={{
                        margin: 0,
                        padding: '1.5rem',
                        fontSize: '0.875rem',
                        background: 'transparent',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                      }}
                    >
                      {snippet.code}
                    </SyntaxHighlighter>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#E2D4BF] to-[#997C53] flex items-center justify-center border border-[#F0E6D2] overflow-hidden p-[1px]">
                        <div className="w-full h-full bg-[#FDFDFB] rounded-full overflow-hidden flex items-center justify-center">
                          {snippet.profiles?.avatar ? (
                            <img src={snippet.profiles.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <CircleUser className="h-6 w-6 text-[#C5A880]" />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-sans font-bold text-[#2C241B] tracking-wide">
                          {snippet.profiles?.full_name || snippet.profiles?.email || 'Unknown Architect'}
                        </span>
                        <span className="text-[9px] font-sans font-bold text-[#A59582] uppercase tracking-[0.2em] mt-0.5">
                          Contributor
                        </span>
                      </div>
                    </div>
                    {snippet.updated_at !== snippet.created_at && (
                      <span className="text-[10px] font-sans font-bold text-[#A59582] uppercase tracking-widest flex items-center">
                        <Diff className="h-3.5 w-3.5 mr-1.5 text-[#C5A880]" />
                        Refined {format(snippet.updated_at, 'MMM d')}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* {totalPages > 1 && (
          <div className="pt-10 flex justify-center">
            <Pagination className="bg-[#FDFDFB] rounded-full p-2 w-auto border border-[#E5DCCB] shadow-lg">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage((p) => Math.max(1, p - 1)); }} />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage((p) => Math.min(totalPages, p + 1)); }} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )} */}

        <Dialog modal={false} open={isDeleteDialogOpen} onOpenChange={(open) => { setIsDeleteDialogOpen(open); if (!open) setSnippetToDeleteId(null); }}>
          <DialogContent className="bg-[#FDFDFB] border border-[#E5DCCB] rounded-[2.5rem] p-8 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-3xl font-sans font-semibold tracking-wide text-[#2C241B]">Erase Blueprint</DialogTitle>
              <DialogDescription className="text-sm font-sans italic text-[#7A6E5D] mt-2">
                Are you sure you want to delete this snippet? This action <span className="text-[#8C2B2B] font-bold underline">cannot be undone</span> and will permanently remove the logic unit from the sanctuary.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-4 mt-8">
              <Button variant="ghost" className="rounded-full px-8 h-12 font-sans font-bold uppercase text-[10px] tracking-[0.15em] text-[#8C7654] hover:text-[#2C241B] hover:bg-[#E5DCCB]/30 transition-all" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="rounded-full px-8 h-12 bg-[#8C2B2B] hover:bg-[#722121] text-white font-sans font-bold uppercase text-[10px] tracking-[0.15em] shadow-lg transition-all" onClick={confirmDelete} disabled={!!actionLoading}>
                {actionLoading === snippetToDeleteId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Deletion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CodeLibrary;