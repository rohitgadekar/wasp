import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { User, Lock, Link as LinkIcon, Plus, Trash2, ExternalLink, Bookmark, Shield, Mail, Key, Globe, LogOut, Settings, Sparkles, UserCircle, Loader2, Fingerprint } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useTitle } from '@/hooks/use-title';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface QuickLink {
    id: string;
    title: string;
    url: string;
    icon?: string;
}

const AVATAR_OPTIONS = [
    "https://res.cloudinary.com/dlz8xu9u7/image/upload/v1779198299/24_xnx1oj.png",
    "https://res.cloudinary.com/dlz8xu9u7/image/upload/v1779198299/23_rwrt3c.png",
    "https://res.cloudinary.com/dlz8xu9u7/image/upload/v1779198299/20_yjhyci.png",
    "https://res.cloudinary.com/dlz8xu9u7/image/upload/v1779198299/19_sow4xu.png"
];

const GOLD = '#C5A880';
const GOLD_LIGHT = '#E5DCCB';
const IVORY = '#FDFDFB';
const IVORY2 = '#FAF9F5';
const BROWN = '#2C241B';
const BROWN_MID = '#8C7654';
const BROWN_LIGHT = '#A59582';

const MyAccount = () => {
    const { user, signOut, registerPasskey } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    useTitle('My Account');

    const [fullName, setFullName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newLinkTitle, setNewLinkTitle] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passkeyLoading, setPasskeyLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Fetch profile with TanStack Query
    const { data: profile } = useQuery({
        queryKey: ['my_profile', user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('profiles')
                .select('full_name, avatar')
                .eq('id', user?.id)
                .single();
            return data;
        },
        enabled: !!user,
    });

    useEffect(() => {
        if (profile?.full_name) {
            setFullName(profile.full_name);
        }
        if (profile?.avatar) {
            setSelectedAvatar(profile.avatar);
        }
    }, [profile]);

    const { data: passkeys = [] } = useQuery({
        queryKey: ['my_passkeys', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase.auth.passkey.list();
            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });

    // Fetch quick links with TanStack Query
    const { data: quickLinks = [] } = useQuery({
        queryKey: ['my_quick_links', user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('quick_links')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: true });
            return data as QuickLink[];
        },
        enabled: !!user,
    });

    const handleUpdateProfile = async () => {
        setLoading(true);
        try {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    avatar: selectedAvatar
                })
                .eq('id', user?.id);

            if (profileError) throw profileError;

            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    avatar: selectedAvatar
                }
            });

            if (authError) throw authError;

            toast({
                title: 'Profile updated',
                description: 'Your profile has been updated successfully.',
            });

            queryClient.invalidateQueries({ queryKey: ['my_profile', user?.id] });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast({ variant: 'destructive', title: 'Error', description: 'Passwords do not match.' });
            return;
        }
        if (newPassword.length < 6) {
            toast({ variant: 'destructive', title: 'Error', description: 'Password must be at least 6 characters.' });
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast({ title: 'Password changed', description: 'Your password has been updated successfully.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuickLink = async () => {
        if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill in both title and URL.' });
            return;
        }
        let url = newLinkUrl.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        setIsAddingLink(true);
        try {
            const { error } = await supabase.from('quick_links').insert({
                user_id: user?.id,
                title: newLinkTitle.trim(),
                url: url,
            });
            if (error) throw error;
            toast({ title: 'Quick link added', description: 'Your bookmark has been saved.' });
            setNewLinkTitle('');
            setNewLinkUrl('');
            setDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['my_quick_links', user?.id] });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsAddingLink(false);
        }
    };

    const handleDeleteQuickLink = async (id: string) => {
        try {
            const { error } = await supabase.from('quick_links').delete().eq('id', id);
            if (error) throw error;
            toast({ title: 'Quick link removed', description: 'Your bookmark has been deleted.' });
            queryClient.invalidateQueries({ queryKey: ['my_quick_links', user?.id] });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    const handleRegisterPasskey = async () => {
        setPasskeyLoading(true);
        try {
            const { error } = await registerPasskey();
            if (!error) queryClient.invalidateQueries({ queryKey: ['my_passkeys', user?.id] });
        } finally {
            setPasskeyLoading(false);
        }
    };

    const handleRemovePasskey = async (id: string) => {
        setPasskeyLoading(true);
        try {
            const { error } = await supabase.auth.passkey.delete({ passkeyId: id });
            if (error) throw error;
            toast({ title: 'Passkey removed', description: 'The passkey was removed from your account.' });
            queryClient.invalidateQueries({ queryKey: ['my_passkeys', user?.id] });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setPasskeyLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/auth');
    };

    // Shared card style
    const cardStyle = {
        background: IVORY,
        boxShadow: '0 8px 40px rgba(44,36,27,0.08), 0 1px 0 #E3DAC9',
        borderColor: GOLD_LIGHT,
    };

    // Shared input className
    const inputCls = "h-12 pl-11 pr-4 rounded-md border focus-visible:ring-0 focus-visible:border-[#C5A880] font-medium text-sm bg-[rgba(44,36,27,0.02)] text-[#2C241B]";

    return (
        <div className="relative min-h-screen">
            <div className="max-w-[1400px] mx-auto p-6 md:p-12 space-y-12 py-16 relative z-10">

                {/* Header Badge */}
                <div className="flex justify-center">
                    <Badge className="bg-[#C5A880]/10 text-[#8C7654] border border-[#E5DCCB] rounded-full px-6 py-1.5 uppercase tracking-[0.3em] text-[10px] font-sans font-bold shadow-sm">
                        My Account
                    </Badge>
                </div>

                <div className="grid gap-10 lg:grid-cols-2">

                    {/* ── Profile Identity Card ── */}
                    <Card className="border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl rounded-2xl" style={cardStyle}>
                        {/* Gold top bar */}
                        <div className="h-[3px] w-full" style={{ background: `linear-gradient(to right, ${GOLD}, #A8896A, ${GOLD})` }} />
                        <CardHeader className="px-8 pt-7 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl overflow-hidden border flex items-center justify-center bg-[#FAF9F5]" style={{ borderColor: GOLD_LIGHT }}>
                                    {selectedAvatar ? (
                                        <img src={selectedAvatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircle className="w-6 h-6 text-[#C5A880]" />
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    <CardTitle className="text-2xl font-bold tracking-tight" style={{ color: BROWN }}>Personal Identity</CardTitle>
                                    <CardDescription className="font-sans font-bold uppercase text-[10px] tracking-[0.2em]" style={{ color: BROWN_LIGHT }}>Registration Protocol</CardDescription>
                                </div>
                            </div>
                            <div className="mt-5 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD_LIGHT}, transparent)` }} />
                        </CardHeader>

                        <CardContent className="px-8 pb-8 space-y-6">
                            {/* Email */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] block" style={{ color: BROWN_MID }}>Digital Anchor</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-3 w-4 h-4" style={{ color: BROWN_LIGHT }} />
                                    <Input
                                        value={user?.email || ''}
                                        disabled
                                        className={inputCls + " opacity-60 cursor-not-allowed"}
                                        style={{ borderColor: GOLD_LIGHT }}
                                    />
                                </div>
                            </div>

                            {/* Full Name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="fullName" className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] block" style={{ color: BROWN_MID }}>Legal Name</Label>
                                <div className="relative">
                                    <Sparkles className="absolute left-3.5 top-3 w-4 h-4 transition-colors" style={{ color: BROWN_LIGHT }} />
                                    <Input
                                        id="fullName"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Identity Name"
                                        className={inputCls}
                                        style={{ borderColor: GOLD_LIGHT }}
                                    />
                                </div>
                            </div>

                            {/* Avatar Picker */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] block" style={{ color: BROWN_MID }}>Profile Picture</Label>
                                <div className="flex gap-3">
                                    {AVATAR_OPTIONS.map((url, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => setSelectedAvatar(url)}
                                            className={cn(
                                                "w-14 h-14 rounded-xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95",
                                                selectedAvatar === url
                                                    ? "scale-105 opacity-100"
                                                    : "opacity-60 hover:opacity-90"
                                            )}
                                            style={{
                                                borderColor: selectedAvatar === url ? GOLD : GOLD_LIGHT,
                                                boxShadow: selectedAvatar === url ? `0 0 0 3px ${GOLD}30` : undefined,
                                            }}
                                        >
                                            <img src={url} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleUpdateProfile}
                                disabled={loading}
                                className="w-full rounded-md h-11 font-sans font-bold uppercase tracking-widest text-xs transition-all hover:opacity-90 active:scale-[0.99]"
                                style={{ background: BROWN, color: IVORY }}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sync Identity
                            </Button>
                        </CardContent>
                    </Card>

                    {/* ── Quick Links Card ── */}
                    <Card className="border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl rounded-2xl" style={cardStyle}>
                        <div className="h-[3px] w-full" style={{ background: `linear-gradient(to right, ${GOLD}, #A8896A, ${GOLD})` }} />
                        <CardHeader className="px-8 pt-7 pb-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#FAF9F5] border flex items-center justify-center" style={{ borderColor: GOLD_LIGHT }}>
                                        <Bookmark className="w-5 h-5 text-[#C5A880]" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <CardTitle className="text-2xl font-bold tracking-tight" style={{ color: BROWN }}>Quick Links</CardTitle>
                                        <CardDescription className="font-sans font-bold uppercase text-[10px] tracking-[0.2em]" style={{ color: BROWN_LIGHT }}>Quick Access Protocol</CardDescription>
                                    </div>
                                </div>

                                <Dialog modal={false} open={dialogOpen} onOpenChange={setDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="rounded-full px-5 h-9 font-sans font-bold tracking-wider text-[10px] uppercase transition-all hover:scale-105 bg-[#FDFDFB] text-[#2C241B] hover:bg-[#FAF9F5] hover:text-[#2C241B]"
                                            style={{ borderColor: GOLD_LIGHT }}
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                                            Anchor URL
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-2xl p-0 max-w-md border shadow-2xl overflow-hidden" style={{ background: IVORY, borderColor: GOLD_LIGHT, boxShadow: '0 20px 60px rgba(44,36,27,0.18)' }}>

                                        {/* <div className="h-[3px] w-full" style={{ background: `linear-gradient(to right, ${GOLD}, #A8896A, ${GOLD})` }} /> */}
                                        <div className="p-8">
                                            <DialogHeader className="mb-6">
                                                <DialogTitle className="text-xl font-bold tracking-tight" style={{ color: BROWN }}>Anchor New URL</DialogTitle>
                                                <p className="text-[11px] font-sans font-bold uppercase tracking-[0.15em] mt-1" style={{ color: BROWN_LIGHT }}>Deploy a navigation anchor to your hub</p>
                                            </DialogHeader>
                                            <div className="space-y-5">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="linkTitle" className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] block" style={{ color: BROWN_MID }}>Node Label</Label>
                                                    <div className="relative">
                                                        <Settings className="absolute left-3.5 top-3 w-4 h-4" style={{ color: BROWN_LIGHT }} />
                                                        <Input
                                                            id="linkTitle"
                                                            value={newLinkTitle}
                                                            onChange={(e) => setNewLinkTitle(e.target.value)}
                                                            placeholder="e.g., JIRA Archive"
                                                            className={inputCls}
                                                            style={{ borderColor: GOLD_LIGHT }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="linkUrl" className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] block" style={{ color: BROWN_MID }}>System Path</Label>
                                                    <div className="relative">
                                                        <Globe className="absolute left-3.5 top-3 w-4 h-4" style={{ color: BROWN_LIGHT }} />
                                                        <Input
                                                            id="linkUrl"
                                                            value={newLinkUrl}
                                                            onChange={(e) => setNewLinkUrl(e.target.value)}
                                                            placeholder="https://console.dev"
                                                            className={inputCls + " font-mono"}
                                                            style={{ borderColor: GOLD_LIGHT }}
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={handleAddQuickLink}
                                                    disabled={isAddingLink}
                                                    className="w-full rounded-md h-11 font-sans font-bold uppercase tracking-widest text-xs transition-all hover:opacity-90"
                                                    style={{ background: BROWN, color: IVORY }}
                                                >
                                                    {isAddingLink ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...</> : 'Deploy Node'}
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="mt-5 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD_LIGHT}, transparent)` }} />
                        </CardHeader>

                        <CardContent className="px-8 pb-8 flex-1">
                            <div className="rounded-xl border overflow-hidden" style={{ borderColor: GOLD_LIGHT, background: IVORY2 }}>
                                {quickLinks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-8 text-center space-y-3">
                                        <div className="w-12 h-12 rounded-full border flex items-center justify-center opacity-40" style={{ borderColor: GOLD_LIGHT }}>
                                            <LinkIcon className="w-5 h-5 text-[#C5A880]" />
                                        </div>
                                        <p className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] max-w-[200px]" style={{ color: BROWN_LIGHT }}>
                                            No navigation anchors deployed
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y" style={{ borderColor: GOLD_LIGHT }}>
                                        {quickLinks.map((link) => (
                                            <div
                                                key={link.id}
                                                className="group/item flex items-center justify-between px-5 py-3.5 hover:bg-[#FDFDFB] transition-all"
                                            >
                                                <a
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 min-w-0 flex-1 transition-colors"
                                                    style={{ color: BROWN }}
                                                >
                                                    <div className="w-7 h-7 rounded-lg border bg-[#FDFDFB] flex items-center justify-center flex-shrink-0 group-hover/item:border-[#C5A880] transition-colors" style={{ borderColor: GOLD_LIGHT }}>
                                                        <ExternalLink className="h-3 w-3" style={{ color: GOLD }} />
                                                    </div>
                                                    <span className="font-sans font-medium text-sm truncate" style={{ color: BROWN }}>{link.title}</span>
                                                </a>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteQuickLink(link.id)}
                                                    className="h-7 w-7 rounded-full text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover/item:opacity-100 ml-2 flex-shrink-0"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Change Password Section ── */}
                <Card className="border overflow-hidden transition-all duration-300 hover:shadow-xl rounded-2xl" style={cardStyle}>
                    <div className="h-[3px] w-full" style={{ background: `linear-gradient(to right, ${GOLD}, #A8896A, ${GOLD})` }} />
                    <CardHeader className="px-8 pt-7 pb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#FAF9F5] border flex items-center justify-center" style={{ borderColor: GOLD_LIGHT }}>
                                <Shield className="w-5 h-5 text-[#C5A880]" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-2xl font-bold tracking-tight" style={{ color: BROWN }}>Security Protocol</CardTitle>
                                <CardDescription className="font-sans font-bold uppercase text-[10px] tracking-[0.2em]" style={{ color: BROWN_LIGHT }}>Update Password</CardDescription>
                            </div>
                        </div>
                        <div className="mt-5 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD_LIGHT}, transparent)` }} />
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <div className="grid gap-5 md:grid-cols-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="newPassword" className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] block" style={{ color: BROWN_MID }}>New Password</Label>
                                <div className="relative">
                                    <Key className="absolute left-3.5 top-3 w-4 h-4" style={{ color: BROWN_LIGHT }} />
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className={inputCls + " font-mono"}
                                        style={{ borderColor: GOLD_LIGHT }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPassword" className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] block" style={{ color: BROWN_MID }}>Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-3 w-4 h-4" style={{ color: BROWN_LIGHT }} />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className={inputCls + " font-mono"}
                                        style={{ borderColor: GOLD_LIGHT }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    onClick={handleChangePassword}
                                    disabled={loading || !newPassword || !confirmPassword}
                                    variant="outline"
                                    className="w-full rounded-md h-11 font-sans font-bold uppercase tracking-wider text-xs transition-all hover:opacity-90 bg-[#FDFDFB] text-[#2C241B] hover:bg-[#FAF9F5] hover:text-[#2C241B]"
                                    style={{ borderColor: GOLD_LIGHT }}
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Password
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Passkeys Section ── */}
                <Card className="border overflow-hidden transition-all duration-300 hover:shadow-xl rounded-2xl" style={cardStyle}>
                    <div className="h-[3px] w-full" style={{ background: `linear-gradient(to right, ${GOLD}, #A8896A, ${GOLD})` }} />
                    <CardHeader className="px-8 pt-7 pb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#FAF9F5] border flex items-center justify-center" style={{ borderColor: GOLD_LIGHT }}>
                                <Fingerprint className="w-5 h-5 text-[#C5A880]" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-2xl font-bold tracking-tight" style={{ color: BROWN }}>Passkeys</CardTitle>
                                <CardDescription className="font-sans font-bold uppercase text-[10px] tracking-[0.2em]" style={{ color: BROWN_LIGHT }}>WebAuthn Device Verification</CardDescription>
                            </div>
                        </div>
                        <div className="mt-5 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD_LIGHT}, transparent)` }} />
                    </CardHeader>
                    <CardContent className="px-8 pb-8 space-y-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border p-5" style={{ borderColor: GOLD_LIGHT, background: IVORY2 }}>
                            <div>
                                <p className="font-sans font-bold text-sm" style={{ color: BROWN }}>Add this device as a passkey</p>
                                <p className="text-xs mt-1" style={{ color: BROWN_LIGHT }}>
                                    After setup, you can sign in using either your email and password or your passkey.
                                </p>
                            </div>
                            <Button
                                onClick={handleRegisterPasskey}
                                disabled={passkeyLoading}
                                className="rounded-md px-6 h-11 font-sans font-bold uppercase tracking-wider text-xs transition-all hover:opacity-90"
                                style={{ background: BROWN, color: IVORY }}
                            >
                                {passkeyLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Fingerprint className="mr-2 h-4 w-4" />}
                                Add Passkey
                            </Button>
                        </div>

                        <div className="rounded-xl border overflow-hidden" style={{ borderColor: GOLD_LIGHT, background: IVORY2 }}>
                            {passkeys.length === 0 ? (
                                <div className="py-8 px-5 text-center">
                                    <p className="text-[10px] font-sans font-bold uppercase tracking-[0.2em]" style={{ color: BROWN_LIGHT }}>No passkeys registered</p>
                                </div>
                            ) : (
                                <div className="divide-y" style={{ borderColor: GOLD_LIGHT }}>
                                    {passkeys.map((passkey) => (
                                        <div key={passkey.id} className="flex items-center justify-between px-5 py-3.5">
                                            <div className="min-w-0">
                                                <p className="font-sans font-medium text-sm truncate" style={{ color: BROWN }}>{passkey.friendly_name || 'Passkey'}</p>
                                                <p className="text-[10px] font-sans uppercase tracking-widest" style={{ color: BROWN_LIGHT }}>
                                                    Created {new Date(passkey.created_at).toLocaleDateString()}
                                                    {passkey.last_used_at ? ` • Last used ${new Date(passkey.last_used_at).toLocaleDateString()}` : ''}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemovePasskey(passkey.id)}
                                                disabled={passkeyLoading}
                                                className="h-8 w-8 rounded-full text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* ── Sign Out Section ── */}
                <Card className="border overflow-hidden transition-all duration-300 rounded-2xl" style={{ ...cardStyle, borderColor: 'rgba(192,57,43,0.15)', background: 'rgba(192,57,43,0.02)' }}>
                    <CardContent className="px-8 py-7 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                                <LogOut className="w-5 h-5 text-rose-500" />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-xl font-bold tracking-tight" style={{ color: BROWN }}>System Termination</h3>
                                <p className="text-xs font-sans font-bold uppercase tracking-widest text-rose-400">End Session Persistence</p>
                            </div>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={handleSignOut}
                            className="rounded-md px-10 h-11 font-sans font-bold uppercase text-xs tracking-widest hover:opacity-90 active:scale-95 transition-all w-full md:w-auto"
                        >
                            Terminate Connection
                        </Button>
                    </CardContent>
                </Card>

                {/* System Status Footer */}
                <div className="text-center pt-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full border shadow-sm" style={{ background: IVORY, borderColor: GOLD_LIGHT }}>
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em]" style={{ color: BROWN_LIGHT }}>Node V10 • Protocol Optimized</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyAccount;