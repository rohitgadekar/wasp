// src/pages/SnippetViewer.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Loader2, AlertCircle, CircleUser, Plus, Diff, Code, Calendar } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useTitle } from '@/hooks/use-title';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  profiles?: {
    full_name: string;
    email: string;
    avatar?: string | null;
  };
}

const SnippetViewer = () => {
  const { id } = useParams<{ id: string }>();
  const [snippet, setSnippet] = useState<CodeSnippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { toast } = useToast();

  useTitle(snippet?.title, snippet?.description);

  useEffect(() => {
    if (!id) return;

    const fetchSnippet = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('code_snippets')
        .select(`
          *,
          profiles (full_name, email, avatar)
        `)
        .eq('id', id)
        .single();

      if (fetchError || !data) {
        setError(true);
      } else {
        setSnippet(data);
      }
      setLoading(false);
    };

    fetchSnippet();
  }, [id]);

  const handleCopy = async () => {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet.code);
    toast({ title: 'Code successfully synchronized to clipboard.' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F5] gap-6">
        <Loader2 className="h-12 w-12 animate-spin text-[#C5A880]" />
      </div>
    );
  }

  if (error || !snippet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] p-6">
        <Card className="max-w-md border-0 rounded-[2.5rem] overflow-hidden shadow-xl" style={{ background: '#FDFDFB', boxShadow: '0 8px 40px rgba(44,36,27,0.10), 0 1px 0 #E3DAC9' }}>
          <CardHeader className="p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-[#FAF9F5] flex items-center justify-center mx-auto mb-6 border" style={{ borderColor: '#E3DAC9' }}>
              <AlertCircle className="h-10 w-10 text-[#C0392B]" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-[#2C241B]">Asset Not Found</CardTitle>
            <CardDescription className="text-base font-bold text-[#8C7654] mt-4 leading-relaxed uppercase tracking-widest text-[10px]">
              The Requested Intellectual Asset May Have Been De-indexed Or The Access Protocol Is Invalid.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-tr from-[#FAF9F5] via-[#FDFDFB] to-[#F3EEE3] overflow-x-hidden select-none">
      <div className="mx-auto max-w-7xl relative space-y-16 px-6 py-20">
        {/* Centered Editorial Header */}
        <div className="flex flex-col items-center text-center space-y-6">
          <Badge className="bg-[#C5A880]/10 text-[#8C7654] border border-[#E5DCCB] rounded-full px-6 py-1.5 uppercase tracking-[0.2em] text-[10px] font-sans font-bold shadow-sm">
            Node Authenticated
          </Badge>
          <div className="space-y-4 flex flex-col items-center justify-center">
            <h1 className="text-5xl md:text-7xl font-normal tracking-tighter text-[#2C241B] leading-tight">
              {snippet.title}

            </h1>
            <p className="text-md font-normal text-[#8C7654] leading-relaxed ">
              {snippet.description}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-[#FAF9F5] px-4 py-2 rounded-xl border border-[#E3DAC9]">
                {snippet.profiles?.avatar ? (
                  <img src={snippet.profiles.avatar} alt="Avatar" className="h-5 w-5 rounded-full object-cover border" style={{ borderColor: '#E3DAC9' }} />
                ) : (
                  <CircleUser className="h-4 w-4 text-[#C5A880]" />
                )}
                <span className="text-[11px] font-bold uppercase tracking-tight text-[#2C241B]">
                  {snippet.profiles?.full_name || 'Anonymous User'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-[#FAF9F5] px-4 py-2 rounded-xl border border-[#E3DAC9]">
                <Calendar className="h-4 w-4 text-[#C5A880]" />
                <span className="text-[11px] font-bold uppercase tracking-tight text-[#2C241B]">
                  {format(snippet.created_at, 'MMMM do, yyyy')}
                </span>
              </div>

            </div>
          </div>
        </div>

        <div className="flex flex-col gap-12">


          {/* Syntax Highlight Container */}
          <div className="relative group">
            <Card className="border-0 overflow-hidden shadow-xl animate-in fade-in duration-500  relative" style={{ background: '#FDFDFB', boxShadow: '0 8px 40px rgba(44,36,27,0.10), 0 1px 0 #E3DAC9' }}>
              <div className="bg-[#FAF9F5] px-8 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E3DAC9' }}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/30" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/30" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/30" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C7654]">Secure Code Viewer</span>
                <a
                  onClick={handleCopy}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer items-center gap-2 text-[11px] font-sans font-bold text-[#8C7654] hover:text-[#2C241B] group/link transition-colors uppercase tracking-[0.15em]"
                >
                  <span className="relative">
                    Copy Snippet
                    <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#C5A880] group-hover/link:w-full transition-all duration-300" />
                  </span>
                </a>
              </div>
              <CardContent className="p-0">
                <div className="syntax-highlighter-wrapper">
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
                      // maxHeight: '400px',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                    }}
                  >
                    {snippet.code}
                  </SyntaxHighlighter>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnippetViewer;