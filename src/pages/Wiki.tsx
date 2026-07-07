import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTitle } from '@/hooks/use-title';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Edit, Trash2, Search, Loader2, BookOpen, Share2, Diff, CircleUser, Filter, Tag, Wand2, Sparkles, BookOpenCheck, Bookmark, Settings2, Globe, Database, Library, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';


interface WikiPage {
    id: string;
    title: string;
    content: string;
    category: string | null;
    tags: string[];
    user_id: string;
    created_at: string;
    updated_at: string;
    profiles?: {
        email: string;
        full_name: string;
        avatar?: string | null;
    };
}

const Wiki = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingPage, setEditingPage] = useState<WikiPage | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [pageToDeleteId, setPageToDeleteId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const { user } = useAuth();
    const { isSuperUser } = useUserRole();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    useTitle('Wiki & Documentation');

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: '',
        tags: '',
    });

    const { data: pages = [], isLoading: loading } = useQuery({
        queryKey: ['wiki_pages'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('wiki_pages')
                .select(`
          *,
          profiles (email, full_name, avatar)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as WikiPage[];
        },
    });

    useEffect(() => {
        if (!isAddDialogOpen && !isDeleteDialogOpen) {
            document.body.style.pointerEvents = 'auto';
            document.body.style.overflow = 'auto';
        }
    }, [isAddDialogOpen, isDeleteDialogOpen]);

    useEffect(() => {
        const channel = supabase
            .channel('wiki_pages_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'wiki_pages' },
                () => queryClient.invalidateQueries({ queryKey: ['wiki_pages'] })
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading('submit');

        const tagsArray = formData.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean);

        const pagePayload = {
            title: formData.title,
            content: formData.content,
            category: formData.category || null,
            tags: tagsArray,
            user_id: user?.id,
        };

        try {
            if (editingPage) {
                const { data: updatedData, error } = await supabase
                    .from('wiki_pages')
                    .update(pagePayload)
                    .eq('id', editingPage.id)
                    .select()
                    .single();

                if (error) throw error;

                queryClient.setQueryData<WikiPage[]>(['wiki_pages'], (old = []) =>
                    old.map((p) => (p.id === editingPage.id ? { ...p, ...updatedData } : p))
                );

                toast({ title: 'Page updated successfully!' });
            } else {
                const { data: newData, error } = await supabase
                    .from('wiki_pages')
                    .insert([pagePayload])
                    .select(`*, profiles (email, full_name, avatar)`)
                    .single();

                if (error) throw error;

                queryClient.setQueryData<WikiPage[]>(['wiki_pages'], (old = []) => [
                    newData as WikiPage,
                    ...old,
                ]);

                toast({ title: 'Page created successfully!' });
            }

            queryClient.invalidateQueries({ queryKey: ['wiki_pages'] });

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: editingPage ? 'Error updating page' : 'Error creating page',
                description: error.message,
            });
        } finally {
            setActionLoading(null);
            resetForm();
            setIsAddDialogOpen(false);
            setEditingPage(null);
        }
    };

    const handleEdit = (page: WikiPage) => {
        setEditingPage(page);
        setFormData({
            title: page.title,
            content: page.content,
            category: page.category || '',
            tags: page.tags.join(', '),
        });
        setIsAddDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        setPageToDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!pageToDeleteId) return;

        const idToDelete = pageToDeleteId;
        setActionLoading(idToDelete);
        setIsDeleteDialogOpen(false);

        queryClient.setQueryData<WikiPage[]>(['wiki_pages'], (old = []) =>
            old.filter((p) => p.id !== idToDelete)
        );

        const { error } = await supabase.from('wiki_pages').delete().eq('id', idToDelete);

        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting page', description: error.message });
            queryClient.invalidateQueries({ queryKey: ['wiki_pages'] });
        } else {
            toast({ title: 'Page deleted successfully!' });
        }

        setActionLoading(null);
        setPageToDeleteId(null);
    };

    const resetForm = () => {
        setFormData({ title: '', content: '', category: '', tags: '' });
        setEditingPage(null);
    };

    const canEdit = (page: WikiPage) => {
        return isSuperUser || page.user_id === user?.id;
    };

    const handleShare = (pageId: string) => {
        const shareUrl = `${window.location.origin}/w/${pageId}`;
        navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Share link copied to clipboard!' });
    };

    const filteredPages = useMemo(() => {
        return pages.filter(
            (page) => {
                const matchesSearch =
                    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    page.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    page.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

                const matchesCategory = selectedCategory === 'all' || page.category === selectedCategory;

                return matchesSearch && matchesCategory;
            }
        );
    }, [pages, searchQuery, selectedCategory]);

    const categories = useMemo(() => {
        const list = new Set<string>();
        pages.forEach(p => {
            if (p.category) list.add(p.category);
        });
        return Array.from(list).sort();
    }, [pages]);

    return (
        <div className="relative min-h-screen">
            <div className="relative space-y-16 mx-auto p-6 md:p-12 max-w-[1400px] py-20 z-10">

                {/* Editorial Header */}
                <div className="text-center flex flex-col items-center justify-center space-y-4">
                    <Badge className="bg-[#C5A880]/10 text-[#8C7654] border border-[#E5DCCB] rounded-full px-6 py-1.5 uppercase tracking-[0.3em] text-[10px] font-sans font-bold mx-auto block w-fit shadow-sm">
                        Knowledge Repository
                    </Badge>
                </div>

                {/* Premium Action Bar */}
                <div className="flex flex-col md:flex-row gap-6 items-center w-full">
                    {/* Search */}
                    <div className="relative flex-1 w-full bg-[#FDFDFB] rounded-[2rem] border border-[#E5DCCB] shadow-[0_15px_30px_rgba(197,168,128,0.1)] transition-all duration-500 focus-within:border-[#C5A880] focus-within:shadow-[0_20px_40px_rgba(197,168,128,0.2)] overflow-hidden">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A59582] transition-colors z-10" />
                        <Input
                            placeholder="Search knowledge nodes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent pl-14 pr-14 h-16 text-lg border-none focus-visible:ring-0 focus-visible:ring-offset-0 outline-none w-full font-sans text-[#2C241B] placeholder:text-[#A59582]/50"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 text-[#8C7654] hover:bg-[#C5A880]/15 hover:text-[#2C241B] transition-all active:scale-95"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        )}
                    </div>

                    {/* Category Filter */}
                    <div className="w-full md:w-56 shrink-0">
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    // variant="outline"
                                    className="w-full h-16 rounded-[2rem] border border-[#E5DCCB] bg-[#FDFDFB] hover:bg-[#FAF9F5] hover:border-[#C5A880] focus:ring-0 outline-none px-6 text-sm font-sans font-bold text-[#2C241B] shadow-[0_15px_30px_rgba(197,168,128,0.08)] transition-all justify-start gap-3"
                                >
                                    <Tag className="h-4 w-4 text-[#C5A880] shrink-0" />
                                    <span className="flex-1 text-left truncate">
                                        {selectedCategory === 'all' ? 'All Sectors' : selectedCategory}
                                    </span>
                                    <Filter className="h-3.5 w-3.5 text-[#A59582] shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="start"
                                sideOffset={8}
                                className="w-56 bg-[#FDFDFB] border border-[#E5DCCB] rounded-2xl shadow-xl p-2"
                            >
                                <DropdownMenuItem
                                    onClick={() => setSelectedCategory('all')}
                                    className="cursor-pointer rounded-xl px-4 py-2.5 font-sans font-bold text-sm text-[#2C241B] focus:bg-[#C5A880]/10 focus:text-[#2C241B] flex items-center justify-between"
                                >
                                    <span>All Sectors</span>
                                    {selectedCategory === 'all' && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] inline-block" />
                                    )}
                                </DropdownMenuItem>
                                {categories.length > 0 && <DropdownMenuSeparator className="bg-[#E5DCCB]/60 my-1" />}
                                {categories.map(cat => (
                                    <DropdownMenuItem
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className="cursor-pointer rounded-xl px-4 py-2.5 font-sans font-bold text-xs text-[#2C241B] uppercase tracking-widest focus:bg-[#C5A880]/10 focus:text-[#2C241B] flex items-center justify-between"
                                    >
                                        <span>{cat}</span>
                                        {selectedCategory === cat && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] inline-block" />
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Publish Button + Dialog */}
                    {user && (
                        <Dialog
                            open={isAddDialogOpen}
                            onOpenChange={(open) => {
                                setIsAddDialogOpen(open);
                                if (!open) resetForm();
                            }}
                            modal={false}
                        >
                            <DialogTrigger asChild>
                                <Button className="rounded-[2rem] px-10 h-16 bg-[#2C241B] hover:bg-[#38322D] text-[#EFEAE2] font-sans font-bold tracking-[0.15em] text-xs uppercase shadow-xl hover:-translate-y-1 active:scale-95 group transition-all shrink-0">
                                    <Plus className="mr-3 h-5 w-5 transition-transform group-hover:rotate-90 text-[#C5A880]" />
                                    Publish Intelligence
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="bg-[#FDFDFB] border border-[#E5DCCB] rounded-[2rem] p-0 max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-[0_40px_100px_rgba(44,36,27,0.15)]">
                                {/* Dark gradient header */}
                                <div className="relative flex-shrink-0 bg-gradient-to-br from-[#2C241B] via-[#3D3125] to-[#2C241B] px-8 pt-8 pb-6 overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none" />
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#C5A880]/5 rounded-full blur-2xl pointer-events-none" />
                                    <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23C5A880'/%3E%3C/svg%3E")` }} />
                                    <div className="relative z-10 flex items-start gap-5">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[9px] font-sans font-bold tracking-[0.3em] uppercase text-[#C5A880]/70 mb-1">
                                                {editingPage ? 'Refinement Mode' : 'Documentation Mode'}
                                            </div>
                                            <DialogTitle className="text-2xl font-sans font-semibold text-[#EFEAE2] tracking-wide leading-tight">
                                                {editingPage ? 'Refine Source' : 'New Intelligence Node'}
                                            </DialogTitle>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C5A880]/50 to-transparent" />
                                </div>

                                {/* Form Body */}
                                <div className="flex-1 overflow-y-auto px-8 custom-scrollbar bg-[#FDFDFB]">
                                    <form id="wikiForm" onSubmit={handleSubmit} className="space-y-6 mt-6 pb-6">

                                        <div className="grid gap-2">
                                            <Label htmlFor="title" className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#8C7654] ml-1 mb-1.5 block">Document Identifier</Label>
                                            <div className="relative group/field">
                                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A59582] group-focus-within/field:text-[#8C7654] transition-colors" />
                                                <Input
                                                    id="title"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    required
                                                    className="h-12 pl-11 pr-4 bg-white/40 border border-[#E3DAC9] rounded-md font-sans text-sm text-[#2C241B] placeholder:text-[#A59582]/30 focus-visible:ring-0 focus-visible:border-2 focus-visible:border-[#C5A880] transition-all"
                                                    placeholder="e.g. CORE SYSTEM ARCHITECTURE"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="grid gap-2">
                                                <Label htmlFor="category" className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#8C7654] ml-1 mb-1.5 block">Sector Classification</Label>
                                                <div className="relative group/field">
                                                    <Settings2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A59582] group-focus-within/field:text-[#8C7654] transition-colors" />
                                                    <Input
                                                        id="category"
                                                        value={formData.category}
                                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                        placeholder="architecture"
                                                        className="h-12 pl-11 pr-4 bg-white/40 border border-[#E3DAC9] rounded-md font-sans text-sm text-[#2C241B] placeholder:text-[#A59582]/30 focus-visible:ring-0 focus-visible:border-2 focus-visible:border-[#C5A880] transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="tags" className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#8C7654] ml-1 mb-1.5 block">Indexed Tags</Label>
                                                <div className="relative group/field">
                                                    <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A59582] group-focus-within/field:text-[#8C7654] transition-colors" />
                                                    <Input
                                                        id="tags"
                                                        value={formData.tags}
                                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                                        placeholder="design, proxy, core"
                                                        className="h-12 pl-11 pr-4 bg-white/40 border border-[#E3DAC9] rounded-md font-sans text-sm text-[#2C241B] placeholder:text-[#A59582]/30 focus-visible:ring-0 focus-visible:border-2 focus-visible:border-[#C5A880] transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="content" className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#8C7654] ml-1 mb-1.5 block">Intelligence Content (Markdown)</Label>
                                            <div data-color-mode="light" className="rounded-md overflow-hidden border border-[#E3DAC9] bg-white/40 focus-within:border-[#C5A880] transition-all">
                                                <MDEditor
                                                    value={formData.content}
                                                    onChange={(val) => setFormData({ ...formData, content: val || '' })}
                                                    preview="edit"
                                                    height={320}
                                                    className="!bg-transparent"
                                                    textareaProps={{ placeholder: 'Synthesize documentation content...' }}
                                                />
                                            </div>
                                        </div>
                                    </form>
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
                                            onClick={() => { setIsAddDialogOpen(false); resetForm(); }}
                                        >
                                            Discard
                                        </Button>
                                        <Button
                                            type="submit"
                                            form="wikiForm"
                                            disabled={actionLoading === 'submit'}
                                            className="h-10 px-8 rounded-lg bg-[#2C241B] hover:bg-[#38322D] text-[#EFEAE2] font-sans font-bold uppercase text-[10px] tracking-[0.15em] shadow-md border border-[#C5A880]/20 hover:border-[#C5A880]/50 transition-all hover:scale-105 active:scale-95"
                                        >
                                            {actionLoading === 'submit' && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-[#C5A880]" />}
                                            {editingPage ? 'Sync Update' : 'Establish Node'}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Pages Grid */}
                <div className="grid gap-8">
                    {loading ? (
                        <div className="grid gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-64 rounded-3xl bg-[#E5DCCB]/20 animate-pulse border border-[#E5DCCB]/50" />
                            ))}
                        </div>
                    ) : filteredPages.length === 0 ? (
                        <Card className="bg-[#FAF9F5] border border-dashed border-[#E5DCCB] rounded-[2rem] shadow-none">
                            <CardContent className="py-24 text-center">
                                <div className="bg-[#C5A880]/10 border border-[#E5DCCB] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <BookOpen className="h-10 w-10 text-[#C5A880]" />
                                </div>
                                <h3 className="text-2xl font-sans font-semibold tracking-wide text-[#2C241B] mb-2">Void in the Archive</h3>
                                <p className="text-[#7A6E5D] font-serif italic text-lg max-w-sm mx-auto">
                                    {pages.length === 0
                                        ? 'The project architecture is currently undocumented. Start the documentation orchestration.'
                                        : 'No intelligence units match your sector filters or search query.'}
                                </p>
                                {(searchQuery || selectedCategory !== 'all') && (
                                    <Button variant="link" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="mt-6 text-[#8C7654] font-sans font-bold uppercase tracking-widest text-[10px] hover:text-[#2C241B]">
                                        Clear Filters
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        filteredPages.map((page) => (
                            <Card key={page.id} className="bg-[#FDFDFB] rounded-[2.5rem] border-[#E5DCCB] hover:border-[#C5A880]/50 transition-all duration-500 hover:shadow-2xl hover:shadow-[#C5A880]/10 group overflow-hidden">
                                <CardHeader className="p-8 pb-4">
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="flex-1 min-w-0">
                                            {/* Category + Date row */}
                                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                                                {page.category && (
                                                    <Badge className="bg-[#C5A880]/15 text-[#8C7654] border-none px-3.5 py-1 rounded-full text-[9px] font-sans font-bold tracking-[0.2em] uppercase">
                                                        {page.category}
                                                    </Badge>
                                                )}
                                                <div className="h-1 w-1 rounded-full bg-[#E5DCCB]" />
                                                <span className="text-[10px] font-sans font-bold text-[#A59582] uppercase tracking-[0.15em]">
                                                    {format(new Date(page.created_at), 'MMMM d, yyyy')}
                                                </span>
                                            </div>

                                            <CardTitle className="text-3xl md:text-4xl font-sans font-semibold text-[#2C241B] mb-3 group-hover:text-[#94764D] transition-colors">
                                                {page.title}
                                            </CardTitle>

                                            {/* Tags */}
                                            {page.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {page.tags.map((tag) => (
                                                        <Badge key={tag} variant="outline" className="rounded-full px-4 py-1.5 text-[9px] font-sans font-bold uppercase tracking-widest border-[#E5DCCB] bg-[#FAF9F5] text-[#8C7654]">
                                                            #{tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="rounded-full h-11 w-11 bg-[#FAF9F5] border border-[#E5DCCB]/60 text-[#8C7654] hover:bg-[#C5A880]/15 hover:text-[#2C241B]"
                                                onClick={() => handleShare(page.id)}
                                            >
                                                <Share2 className="h-4 w-4" />
                                            </Button>
                                            {canEdit(page) && (
                                                <>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="rounded-full h-11 w-11 bg-[#FAF9F5] border border-[#E5DCCB]/60 text-[#8C7654] hover:bg-[#C5A880]/15 hover:text-[#2C241B]"
                                                        onClick={() => handleEdit(page)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="rounded-full h-11 w-11 bg-[#FAF9F5] border border-[#E5DCCB]/60 text-[#8C2B2B]/70 hover:bg-[#8C2B2B]/10 hover:text-[#8C2B2B]"
                                                        onClick={() => handleDelete(page.id)}
                                                        disabled={actionLoading === page.id}
                                                    >
                                                        {actionLoading === page.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-8 pt-2">
                                    {/* Markdown Content */}
                                    <div className="relative rounded-2xl overflow-hidden bg-white border border-[#E5DCCB]/60 p-6">
                                        <div data-color-mode="light" className="prose prose-sm max-w-none text-[#4A3F32] leading-relaxed markdown-content">
                                            <MDEditor.Markdown source={page.content || '*Node content undefined*'} />
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#FAF9F5] to-transparent pointer-events-none" />
                                    </div>

                                    {/* Contributor Footer */}
                                    <div className="mt-6 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#E2D4BF] to-[#997C53] flex items-center justify-center border border-[#F0E6D2] overflow-hidden p-[1px]">
                                                <div className="w-full h-full bg-[#FDFDFB] rounded-full overflow-hidden flex items-center justify-center">
                                                    {page.profiles?.avatar ? (
                                                        <img src={page.profiles.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <CircleUser className="h-6 w-6 text-[#C5A880]" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-sans font-bold text-[#2C241B] tracking-wide">
                                                    {page.profiles?.full_name || page.profiles?.email || 'Unknown Author'}
                                                </span>
                                                <span className="text-[9px] font-sans font-bold text-[#A59582] uppercase tracking-[0.2em] mt-0.5">
                                                    Contributor
                                                </span>
                                            </div>
                                        </div>
                                        {page.updated_at !== page.created_at && (
                                            <span className="text-[10px] font-sans font-bold text-[#A59582] uppercase tracking-widest flex items-center">
                                                <Diff className="h-3.5 w-3.5 mr-1.5 text-[#C5A880]" />
                                                Revised {format(new Date(page.updated_at), 'MMM d')}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
                setIsDeleteDialogOpen(open);
                if (!open) setPageToDeleteId(null);
            }}>
                <DialogContent className="bg-[#FDFDFB] border border-[#E5DCCB] rounded-[2.5rem] p-8 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-sans font-semibold tracking-wide text-[#2C241B]">Terminate Node?</DialogTitle>
                        <DialogDescription className="text-lg font-serif italic text-[#7A6E5D] mt-2">
                            Are you sure you want to delete this intelligence unit? This action <span className="text-[#8C2B2B] font-bold underline">cannot be undone</span> and will remove the content from the knowledge architecture.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-4 mt-8">
                        <Button
                            variant="ghost"
                            className="rounded-full px-8 h-12 font-sans font-bold uppercase text-[10px] tracking-[0.15em] text-[#8C7654] hover:text-[#2C241B] hover:bg-[#E5DCCB]/30 transition-all"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Keep Intelligence
                        </Button>
                        <Button
                            className="rounded-full px-8 h-12 bg-[#8C2B2B] hover:bg-[#722121] text-white font-sans font-bold uppercase text-[10px] tracking-[0.15em] shadow-lg transition-all"
                            onClick={confirmDelete}
                            disabled={!!actionLoading}
                        >
                            {actionLoading === pageToDeleteId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Terminate Node
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Wiki;