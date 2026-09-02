import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Terminal, Plus, Diff, CircleUser, Binary } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import { useTitle } from '@/hooks/use-title';
import { format } from 'date-fns';

interface Script {
    id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    profiles?: {
        full_name: string;
        email: string;
    };
}

const decodeSafe = (str?: string) => {
    if (!str) return '';
    try {
        return decodeURIComponent(str);
    } catch {
        return str;
    }
};

const ScriptViewer = () => {
    const { id } = useParams<{ id: string }>();
    const [script, setScript] = useState<Script | any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const decodedId = decodeSafe(id);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);
    const currentTitle = script?.title || (!isUuid && decodedId ? decodedId : 'Script Repo');

    useTitle(currentTitle, "SCRIPT");

    useEffect(() => {
        if (!id) return;

        const fetchScript = async () => {
            setLoading(true);
            setError(false);

            try {
                let query = supabase
                    .from('scripts')
                    .select(`
                        *,
                        profiles (email, full_name)
                    `);

                if (isUuid) {
                    query = query.eq('id', decodedId);
                } else {
                    query = query.eq('title', decodedId);
                }

                let { data, error: fetchError } = await query.limit(1).maybeSingle();

                if ((fetchError || !data) && !isUuid) {
                    const retry = await supabase
                        .from('scripts')
                        .select(`
                            *,
                            profiles (email, full_name)
                        `)
                        .ilike('title', decodedId)
                        .limit(1)
                        .maybeSingle();

                    if (retry.data) {
                        data = retry.data;
                        fetchError = null;
                    }
                }

                if (fetchError || !data) {
                    setError(true);
                } else {
                    setScript(data);
                }
            } catch (err) {
                console.error('Error fetching script:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchScript();
    }, [id, decodedId, isUuid]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="relative flex h-16 w-16 items-center justify-center">

                    {/* Recessed circular track */}
                    <div
                        className="
        absolute inset-0 rounded-full
        shadow-[
          inset_0_2px_3px_rgba(0,0,0,0.10),
          inset_0_-2px_3px_rgba(255,255,255,0.75),
          0_1px_2px_rgba(255,255,255,0.6)
        ]
      "
                    />

                    {/* Soft gold depth */}
                    <div
                        className="
        absolute inset-[5px] rounded-full
        bg-[#C9A66B]/10
        blur-[4px]
      "
                    />

                    {/* Main embossed loader */}
                    <Loader2
                        className="relative z-10 h-10 w-10 animate-spin"
                        style={{
                            color: '#C9A66B',
                            strokeWidth: 2.5,
                            filter: `
          drop-shadow(0 1px 1px rgba(120,90,45,0.28))
          drop-shadow(0 -1px 0 rgba(255,255,255,0.65))
        `,
                        }}
                    />

                    {/* Metallic highlight */}
                    <div
                        className="
        pointer-events-none absolute inset-[11px]
        rounded-full
        bg-gradient-to-br
        from-white/35
        via-transparent
        to-[#9D7845]/10
      "
                    />
                </div>
            </div>
        );
    }

    if (error || !script) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] p-6">
                <Card className="max-w-md border-0 rounded-[2.5rem] overflow-hidden shadow-xl" style={{ background: '#FDFDFB', boxShadow: '0 8px 40px rgba(44,36,27,0.10), 0 1px 0 #E3DAC9' }}>
                    <CardHeader className="p-10 text-center">
                        <div className="w-20 h-20 rounded-full bg-[#FAF9F5] flex items-center justify-center mx-auto mb-6 border" style={{ borderColor: '#E3DAC9' }}>
                            <AlertCircle className="h-10 w-10 text-[#C0392B]" />
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight text-[#2C241B]">Protocol Inaccessible</CardTitle>
                        <CardDescription className="text-base font-bold text-[#8C7654] mt-4 leading-relaxed uppercase tracking-widest text-[10px]">
                            The Requested Automation Node May Have Been De-indexed Or The Access Protocol Is Invalid.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative bg-gradient-to-tr from-[#FAF9F5] via-[#FDFDFB] to-[#F3EEE3] overflow-x-hidden select-none">
            <div className="mx-auto max-w-6xl relative space-y-16 px-6 py-20">
                {/* Centered Editorial Header */}
                <div className="flex flex-col items-center text-center space-y-6">
                    <Badge className="bg-[#C5A880]/10 text-[#8C7654] border border-[#E5DCCB] rounded-full px-6 py-1.5 uppercase tracking-[0.2em] text-[10px] font-sans font-bold shadow-sm">
                        Node Authenticated
                    </Badge>
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-normal tracking-tighter text-[#2C241B] leading-tight">
                            {script.title}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                            <div className="flex items-center gap-2 bg-[#FDFDFB] px-4 py-2 rounded-xl border border-[#E3DAC9]">
                                <CircleUser className="h-4 w-4 text-[#C5A880]" />
                                <span className="text-[11px] font-bold uppercase tracking-tight text-[#2C241B]">
                                    {script.profiles?.full_name || 'Anonymous Contributor'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-[#FDFDFB] px-4 py-2 rounded-xl border border-[#E3DAC9]">
                                <Plus className="h-4 w-4 text-[#C5A880]" />
                                <span className="text-[11px] font-bold uppercase tracking-tight text-[#2C241B]">
                                    {format(new Date(script.created_at), 'MMMM do, yyyy')}
                                </span>
                            </div>
                            {script.updated_at !== script.created_at && (
                                <div className="flex items-center gap-2 bg-[#FDFDFB] px-4 py-2 rounded-xl border border-[#E3DAC9]">
                                    <Diff className="h-4 w-4 text-[#C5A880]" />
                                    <span className="text-[11px] font-bold uppercase tracking-tight text-[#2C241B]">
                                        REV {format(new Date(script.updated_at), 'MMMM do, yyyy')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative group">
                    <Card className="border-0 overflow-hidden shadow-xl animate-in fade-in duration-500  relative" style={{ background: '#FDFDFB', boxShadow: '0 8px 40px rgba(44,36,27,0.10), 0 1px 0 #E3DAC9' }}>
                        <div className="bg-[#FAF9F5] px-8 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E3DAC9' }}>
                            <div className="flex items-center gap-3">
                                <Binary className="h-4 w-4 text-[#C5A880]" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C7654]">Automation Payload</span>
                            </div>
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#E5DCCB]" />
                                <div className="w-2 h-2 rounded-full bg-[#E5DCCB]" />
                                <div className="w-2 h-2 rounded-full bg-[#E5DCCB]" />
                            </div>
                        </div>
                        <CardContent className="p-10 pt-12">
                            <div data-color-mode="light" className="markdown-container">
                                <MDEditor.Markdown
                                    source={script.content}
                                    className="!bg-transparent text-[#2C241B] font-medium leading-relaxed tracking-tight"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ScriptViewer;
