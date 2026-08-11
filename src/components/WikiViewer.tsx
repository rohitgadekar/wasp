import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, BookOpen, UserIcon, Diff, Plus, CircleUser } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import { useTitle } from '@/hooks/use-title';
import { format } from 'date-fns';

interface WikiPage {
    id: string;
    title: string;
    content: string;
    category: string | null;
    tags: string[];
    created_at: string;
    updated_at: string;
    profiles?: {
        full_name: string;
        email: string;
        avatar?: string | null;
    };
}

const WikiPageViewer = () => {
    const { id } = useParams<{ id: string }>();
    const [page, setPage] = useState<WikiPage | any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useTitle(page?.title || 'Wiki & Documentation', "Wikipedia");

    useEffect(() => {
        if (!id) return;

        const fetchPage = async () => {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('wiki_pages')
                .select(`
                    *,
                    profiles (email, full_name, avatar)
                `)
                .eq('id', id)
                .single();

            if (fetchError || !data) {
                setError(true);
            } else {
                setPage(data);
            }
            setLoading(false);
        };

        fetchPage();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                    <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
                </div>
            </div>
        );
    }

    if (error || !page) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <Card className="max-w-md glass-card border-destructive/20 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <CardHeader className="p-10 text-center">
                        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="h-10 w-10 text-destructive" />
                        </div>
                        <CardTitle className="text-3xl font-black tracking-tight text-foreground/90">Archive Inaccessible</CardTitle>
                        <CardDescription className="text-base font-bold text-muted-foreground mt-4 leading-relaxed uppercase tracking-widest text-[10px]">
                            The Requested Neural Archive May Have Been De-indexed Or The Access Protocol Is Invalid.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative bg-gradient-to-tr from-[#FAF9F5] via-[#FDFDFB] to-[#F3EEE3] overflow-x-hidden">


            <div className="mx-auto max-w-6xl relative space-y-16 px-6 py-20">
                {/* Centered Editorial Header */}
                <div className="flex flex-col items-center text-center space-y-6">
                    <Badge className="bg-[#C5A880]/10 text-[#8C7654] border border-[#E5DCCB] rounded-full px-6 py-1.5 uppercase tracking-[0.2em] text-[10px] font-sans font-bold shadow-sm">
                        Node Authenticated
                    </Badge>
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-normal tracking-tighter text-[#2C241B] leading-tight">
                            {page.title}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                            <div className="flex items-center gap-2 bg-foreground/5 dark:bg-foreground/10 px-4 py-2 rounded-xl border border-white/10">
                                {page.profiles?.avatar ? (
                                    <img src={page.profiles.avatar} alt="Avatar" className="h-5 w-5 rounded-full object-cover border border-white/20" />
                                ) : (
                                    <CircleUser className="h-4 w-4 text-primary" />
                                )}
                                <span className="text-[11px] font-black uppercase tracking-tight text-foreground/80">
                                    {page.profiles?.full_name || 'Anonymous Contributor'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-foreground/5 dark:bg-foreground/10 px-4 py-2 rounded-xl border border-white/10">
                                <Plus className="h-4 w-4 text-primary" />
                                <span className="text-[11px] font-black uppercase tracking-tight text-foreground/80">
                                    {format(page.created_at, 'MMMM do, yyyy')}
                                </span>
                            </div>
                            {page.updated_at !== page.created_at && (
                                <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
                                    <Diff className="h-4 w-4 text-primary" />
                                    <span className="text-[11px] font-black uppercase tracking-tight text-primary">
                                        REV {format(page.updated_at, 'MMMM do, yyyy')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4">
                        {page.category && (
                            <Badge className="bg-primary text-primary-foreground rounded-lg px-4 py-1 uppercase font-black text-[10px] tracking-widest shadow-lg shadow-primary/20">
                                {page.category}
                            </Badge>
                        )}
                        {page.tags.map((tag) => (
                            <Badge key={tag} className="glass-card border-white/10 text-foreground/70 rounded-lg px-4 py-1 uppercase font-bold text-[9px] tracking-widest">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 to-primary/20 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
                    <Card className="glass-card  border-white/20 dark:border-white/10 overflow-hidden shadow-3xl relative">
                        <div className="bg-foreground/5 dark:bg-white/5 px-8 py-4 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <BookOpen className="h-4 w-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Knowledge Payload</span>
                            </div>
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-foreground/10" />
                                <div className="w-2 h-2 rounded-full bg-foreground/10" />
                                <div className="w-2 h-2 rounded-full bg-foreground/10" />
                            </div>
                        </div>
                        <CardContent className="p-10 pt-12">
                            <div data-color-mode="light" className="markdown-container">
                                <MDEditor.Markdown
                                    source={page.content}
                                    className="!bg-transparent !text-foreground font-medium leading-relaxed tracking-tight"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default WikiPageViewer;
