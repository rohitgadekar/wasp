// src/pages/UserManagement.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useTitle } from '@/hooks/use-title';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Shield, Trash2, Loader2, UserCircle, Mail, Key, ShieldCheck, AlertCircle, ChevronDown, Hexagon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  is_banned: boolean;
  user_roles?: Array<{ role: string }>;
}

interface HiveAccessMap {
  [userId: string]: boolean;
}

const UserManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useTitle('User Management', 'Manage users and their roles');

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'member' as 'member' | 'moderator' | 'owner' | 'manager',
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch current user role with TanStack Query
  const { data: userRole = null } = useQuery({
    queryKey: ['current_user_role', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .single();
      return data?.role as 'member' | 'moderator' | 'owner' | 'manager' | null;
    },
    enabled: !!user,
  });

  // Check access and redirect if needed
  useEffect(() => {
    if (userRole !== null && userRole !== 'moderator' && userRole !== 'owner' && userRole !== 'manager') {
      toast({
        variant: 'destructive',
        title: 'Access denied',
        description: 'You need manager, moderator or owner permissions to access this page',
      });
      navigate('/');
    }
  }, [userRole, toast, navigate]);

  // Fetch users with TanStack Query
  const { data: users = [], isLoading: loading } = useQuery({
    queryKey: ['users_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`*, user_roles (role)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as UserProfile[];
    },
    enabled: !!userRole && (userRole === 'moderator' || userRole === 'owner' || userRole === 'manager'),
  });

  // Fetch hive access map for all users (all authenticated users can read via RLS)
  const { data: hiveAccessMap = {} } = useQuery<HiveAccessMap>({
    queryKey: ['hive_access_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hive_access')
        .select('user_id, enabled');
      if (error) throw error;
      return Object.fromEntries((data ?? []).map(r => [r.user_id, r.enabled]));
    },
    enabled: !!userRole && (userRole === 'moderator' || userRole === 'owner' || userRole === 'manager'),
  });

  const [hiveToggleLoading, setHiveToggleLoading] = useState<string | null>(null);
  const [banToggleLoading, setBanToggleLoading] = useState<string | null>(null);

  const handleHiveToggle = async (targetUserId: string, currentEnabled: boolean) => {
    if (userRole !== 'owner') return;
    setHiveToggleLoading(targetUserId);

    // Upsert — handles both first-time and subsequent toggles
    const { error } = await supabase
      .from('hive_access')
      .upsert(
        {
          user_id: targetUserId,
          enabled: !currentEnabled,
          granted_by: user?.id,
          granted_at: !currentEnabled ? new Date().toISOString() : null,
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to update Hive access', description: error.message });
    } else {
      toast({
        title: !currentEnabled ? 'Hive access granted' : 'Hive access revoked',
        description: !currentEnabled
          ? 'User can now use the Hive extension.'
          : 'User no longer has Hive extension access.',
      });
      queryClient.invalidateQueries({ queryKey: ['hive_access_all'] });
    }

    setHiveToggleLoading(null);
  };
  const handleBanToggle = async (targetUser: UserProfile) => {
    if (userRole !== 'owner' || targetUser.id === user?.id) return;

    setBanToggleLoading(targetUser.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user-ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ user_id: targetUser.id, banned: !targetUser.is_banned }),
      });
      const result = await response.json();

      if (!response.ok) {
        toast({ variant: 'destructive', title: 'Unable to update account status', description: result.error || 'Please try again.' });
        return;
      }

      toast({
        title: targetUser.is_banned ? 'User unbanned' : 'User banned',
        description: targetUser.is_banned
          ? `${targetUser.full_name || targetUser.email} can sign in again.`
          : `${targetUser.full_name || targetUser.email} can no longer sign in.`,
      });
      queryClient.invalidateQueries({ queryKey: ['users_list'] });
    } catch {
      toast({ variant: 'destructive', title: 'Unable to update account status', description: 'Please try again.' });
    } finally {
      setBanToggleLoading(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            email: newUser.email,
            password: newUser.password,
            fullName: newUser.fullName,
            role: newUser.role,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Error creating user',
          description: result.error,
        });
        setActionLoading(false);
        return;
      }

      toast({ title: 'User created successfully!' });
      setNewUser({ email: '', password: '', fullName: '', role: 'member' });
      setIsDialogOpen(false);
      setActionLoading(false);
      queryClient.invalidateQueries({ queryKey: ['users_list'] });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error creating user',
        description: 'Failed to create user',
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'member' | 'moderator' | 'owner' | 'manager') => {
    // Only owners can change roles
    if (userRole !== 'owner') {
      toast({
        variant: 'destructive',
        title: 'Insufficient permissions',
        description: 'Only owners can change user roles',
      });
      return;
    }

    // Prevent users from changing their own role
    if (userId === user?.id) {
      toast({
        variant: 'destructive',
        title: 'Cannot modify your own role',
      });
      return;
    }

    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error updating role',
        description: error.message,
      });
      return;
    }
    toast({ title: 'User role updated successfully!' });
    queryClient.invalidateQueries({ queryKey: ['users_list'] });
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setActionLoading(true);

    // Prevent users from deleting themselves
    if (userToDelete.id === user?.id) {
      toast({
        variant: 'destructive',
        title: 'Cannot delete yourself',
      });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      setActionLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ user_id: userToDelete.id }),
        }
      );

      if (!response.ok) {
        const result = await response.json();
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to delete user',
        });
        setActionLoading(false);
        return;
      }

      toast({ title: 'User deleted successfully!' });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      setActionLoading(false);
      queryClient.invalidateQueries({ queryKey: ['users_list'] });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete user',
      });
      setActionLoading(false);
    }
  };

  const generateStrongPassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const all = lowercase + uppercase + numbers + symbols;
    let password = '';

    // Ensure at least one of each
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest to make it 16 chars
    for (let i = password.length; i < 16; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  if (!userRole || (userRole !== 'moderator' && userRole !== 'owner')) return null;

  const getUserRole = (user: UserProfile): string => {
    return user.user_roles?.[0]?.role || 'member';
  };

  const getRoleBadgeLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'moderator':
        return 'Moderator';
      case 'manager':
        return 'Manager';
      case 'member':
      default:
        return 'Member';
    }
  };

  const canDeleteUser = (targetUser: UserProfile) => {
    const targetRole = getUserRole(targetUser);

    // Owners can delete anyone (except themselves, checked elsewhere)
    if (userRole === 'owner') return true;

    // Moderators can only delete members
    if (userRole === 'moderator' && targetRole === 'member') return true;

    return false;
  };

  return (
    <div className="relative min-h-screen">
      <div className="relative space-y-10 mx-auto p-6 md:p-10 max-w-6xl pb-20 z-10">

        {/* Page Header */}
        <div className="flex items-center justify-center">
          <Badge className="bg-[#C5A880]/10 text-[#8C7654] border border-[#E5DCCB] rounded-full px-6 py-1.5 uppercase tracking-[0.3em] text-[10px] font-sans font-bold shadow-sm">
            User Management
          </Badge>


        </div>

        {/* User Table Card */}
        <Card className="border-0 overflow-hidden shadow-xl rounded-3xl border" >
          <CardHeader className="px-8 pt-6 pb-3">
            <div className="flex items-center justify-between gap-4">

              <div>
                <h2 className="text-2xl font-heading" style={{ color: '#2C241B' }}>System Users</h2>
                <p className="text-[12px] font-medium mt-0.5" style={{ color: '#A59582' }}>
                  Managing <span style={{ color: '#8C7654' }}>{users.length}</span> team members
                </p>
              </div>
              {/* Provision User Dialog trigger */}
              <Dialog modal={false} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="flex items-center h-10 w-10 rounded-full text-xs font-bold uppercase tracking-widest shadow-md border-0 transition-all hover:scale-105 hover:shadow-lg"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </Button>
                </DialogTrigger>
                {/* Provision User Dialog Content */}
                <DialogContent className="border-0 rounded-2xl p-0 max-w-lg overflow-hidden shadow-2xl">
                  {/* Gradient header band */}
                  <div className="px-8 pt-8 pb-6 relative" style={{ background: 'linear-gradient(135deg, #2C241B 0%, #4A3C2E 100%)' }}>
                    <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(circle at 70% 30%, #C5A880, transparent 60%)' }} />
                    <button
                      onClick={() => setIsDialogOpen(false)}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer z-10 transition-all hover:bg-white/10"
                      style={{ color: '#C5A880' }}
                    >
                      ✕
                    </button>
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold" style={{ color: '#FDFDFB' }}>New Protocol</DialogTitle>
                      <DialogDescription className="text-sm font-medium mt-1" style={{ color: 'rgba(197,168,128,0.7)' }}>
                        Add a new operational entity to the system network.
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                  <form onSubmit={handleCreateUser} className="p-8 space-y-5">
                    <div className="grid gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="fullName" className="text-[10px] font-bold uppercase tracking-[0.18em] block" style={{ color: '#8C7654' }}>Legal Identity</label>
                        <div className="relative group/field">
                          <UserCircle className="absolute left-4 top-3 w-4 h-4 text-[#A59582] group-focus-within/field:text-[#8C7654] transition-colors" />
                          <Input
                            id="fullName"
                            value={newUser.fullName}
                            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                            required
                            placeholder="Full Name"
                            className="pl-11 pr-4 py-3 rounded-md border focus-visible:ring-0 focus-visible:border-[#C5A880] font-medium text-sm"
                            style={{ borderColor: '#E3DAC9', background: 'rgba(44,36,27,0.02)', color: '#2C241B' }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-[0.18em] block" style={{ color: '#8C7654' }}>Email Address</label>
                        <div className="relative group/field">
                          <Mail className="absolute left-4 top-3 w-4 h-4 text-[#A59582] group-focus-within/field:text-[#8C7654] transition-colors" />
                          <Input
                            id="email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            required
                            placeholder="Email Address"
                            className="pl-11 pr-4 py-3 rounded-md border focus-visible:ring-0 focus-visible:border-[#C5A880] font-medium text-sm"
                            style={{ borderColor: '#E3DAC9', background: 'rgba(44,36,27,0.02)', color: '#2C241B' }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-[0.18em] block" style={{ color: '#8C7654' }}>Access Sequence</label>
                        <div className="relative group/password">
                          <Key className="absolute left-4 top-3 w-4 h-4 text-[#A59582]" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            placeholder="Secure Sequence"
                            className="pl-11 pr-28 py-3 rounded-md border focus-visible:ring-0 focus-visible:border-[#C5A880] font-mono text-sm"
                            style={{ borderColor: '#E3DAC9', background: 'rgba(44,36,27,0.02)', color: '#2C241B' }}
                            required
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <Button type="button" variant="ghost" size="sm"
                              className="h-7 rounded-full px-2.5 text-[8px] font-bold uppercase tracking-widest"
                              style={{ color: '#8C7654' }}
                              onClick={async () => {
                                const generated = generateStrongPassword();
                                setNewUser({ ...newUser, password: generated });
                                await navigator.clipboard.writeText(generated);
                                toast({ title: "Sequence Anchored", description: "Secure string moved to system clipboard" });
                              }}
                            >
                              Generate
                            </Button>
                            <Button type="button" variant="ghost" size="sm"
                              className="h-7 w-7 rounded-full p-0 flex items-center justify-center"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <ShieldCheck className="h-3.5 w-3.5" style={{ color: '#8C7654' }} /> : <Shield className="h-3.5 w-3.5" style={{ color: '#A59582' }} />}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.18em] block" style={{ color: '#8C7654' }}>Authorization Level</label>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={userRole !== 'owner'}
                              className="w-full h-11 px-4 flex justify-between items-center rounded-md border text-sm font-medium bg-[rgba(44,36,27,0.02)] text-[#2C241B] hover:bg-[rgba(44,36,27,0.05)] hover:text-[#2C241B] disabled:opacity-50"
                              style={{ borderColor: '#E3DAC9' }}
                            >
                              <span className="capitalize">{newUser.role}</span>
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto border shadow-xl rounded-xl p-1 z-50" style={{ borderColor: '#E3DAC9', background: '#FDFDFB' }}>
                            <DropdownMenuItem onClick={() => setNewUser({ ...newUser, role: 'member' })} className="rounded-lg focus:bg-[#FAF9F5] focus:text-[#2C241B] cursor-pointer">
                              <span className={newUser.role === 'member' ? "font-bold text-[#8C7654]" : ""}>Member</span>
                              {newUser.role === 'member' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#8C7654]"></span>}
                            </DropdownMenuItem>
                            {userRole === 'owner' && (
                              <>
                                <DropdownMenuItem onClick={() => setNewUser({ ...newUser, role: 'manager' })} className="rounded-lg focus:bg-[#FAF9F5] focus:text-[#2C241B] cursor-pointer">
                                  <span className={newUser.role === 'manager' ? "font-bold text-[#8C7654]" : ""}>Manager</span>
                                  {newUser.role === 'manager' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#8C7654]"></span>}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setNewUser({ ...newUser, role: 'moderator' })} className="rounded-lg focus:bg-[#FAF9F5] focus:text-[#2C241B] cursor-pointer">
                                  <span className={newUser.role === 'moderator' ? "font-bold text-[#8C7654]" : ""}>Moderator</span>
                                  {newUser.role === 'moderator' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#8C7654]"></span>}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setNewUser({ ...newUser, role: 'owner' })} className="rounded-lg focus:bg-[#FAF9F5] focus:text-[#2C241B] cursor-pointer">
                                  <span className={newUser.role === 'owner' ? "font-bold text-[#8C7654]" : ""}>Owner</span>
                                  {newUser.role === 'owner' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#8C7654]"></span>}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <DialogFooter className="gap-2 pt-2">
                      <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={actionLoading}
                        className="rounded-full px-6 h-10 text-xs font-bold uppercase tracking-widest border transition-all"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={actionLoading}
                        className="rounded-full px-8 h-10 text-xs font-bold uppercase tracking-widest border-0 shadow-md transition-all"
                      >
                        {actionLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                        Confirm Provision
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          {/* <div className="mx-8 h-px" style={{ background: 'linear-gradient(to right, transparent, #E3DAC9, transparent)' }} /> */}
          {/* ... keep everything above CardContent the same ... */}

          <CardContent className="px-8 pb-8 pt-4">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin" style={{ color: '#C5A880' }} />
                <p className="text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: '#A59582' }}>
                  Syncing Database
                </p>
              </div>
            ) : (
              <div className=" border overflow-hidden rounded-xl" style={{ borderColor: '#E3DAC9' }}>
                <div className="">
                  <Table className="border-collapse">
                    <TableHeader className="sticky top-0 z-20" style={{ background: '#FAF9F5' }}>
                      <TableRow className="border-b h-11" style={{ borderColor: '#E3DAC9' }}>
                        {/* Identity (grouped) */}
                        <TableHead
                          className="font-bold uppercase tracking-[0.15em] text-[10px] px-6"
                          style={{ color: '#8C7654', borderRight: '1px solid #E3DAC9' }}
                        >
                          Identity
                        </TableHead>

                        {/* Authorization */}
                        <TableHead
                          className="font-bold uppercase tracking-[0.15em] text-[10px] px-6"
                          style={{ color: '#8C7654', borderRight: '1px solid #E3DAC9' }}
                        >
                          Authorization
                        </TableHead>

                        {/* Hive */}
                        <TableHead
                          className="font-bold uppercase tracking-[0.15em] text-[10px] px-6"
                          style={{ color: '#8C7654', borderRight: '1px solid #E3DAC9' }}
                        >
                          <span className="flex items-center gap-1.5">
                            Hive EXT
                          </span>
                        </TableHead>

                        {/* Role */}
                        <TableHead
                          className="font-bold uppercase tracking-[0.15em] text-[10px] px-6 text-center"
                          style={{ color: '#8C7654', borderRight: '1px solid #E3DAC9' }}
                        >
                          Role
                        </TableHead>

                        {/* Ban */}
                        <TableHead
                          className="font-bold uppercase tracking-[0.15em] text-[10px] px-6 text-center"
                          style={{ color: '#8C7654', borderRight: '1px solid #E3DAC9' }}
                        >
                          Status
                        </TableHead>

                        {/* Delete */}
                        <TableHead
                          className="font-bold uppercase tracking-[0.15em] text-[10px] px-6 text-right"
                          style={{ color: '#8C7654' }}
                        >
                          Purge
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {users.map((mappedUser) => {
                        const mappedUserRole = getUserRole(mappedUser);
                        return (
                          <TableRow
                            key={mappedUser.id}
                            className="border-b transition-colors hover:bg-[#FAF9F5]"
                            style={{ borderColor: '#F0EAE0' }}
                          >
                            {/* ── Identity: name + status + email + deployment ── */}
                            <TableCell className="px-6 py-4 border-r" style={{ borderColor: '#F0EAE0' }}>
                              <div className="flex items-start gap-3">
                                <div className="min-w-0 space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm" style={{ color: '#2C241B' }}>
                                      {mappedUser.full_name || 'Anonymous'}
                                    </span>
                                    {userRole === 'owner' &&
                                      <Badge
                                        className={`h-5 px-2 text-[8px] uppercase tracking-wider ${mappedUser.is_banned
                                          ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-50'
                                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                                          }`}
                                      >
                                        <span
                                          className={`mr-1 h-1.5 w-1.5 rounded-full ${mappedUser.is_banned ? 'bg-red-500' : 'bg-emerald-500'
                                            }`}
                                        />
                                        {mappedUser.is_banned ? 'Banned' : 'Active'}
                                      </Badge>}
                                  </div>
                                  <p className="text-xs truncate" style={{ color: '#A59582' }}>
                                    {mappedUser.email}
                                  </p>
                                  <p className="text-[10px] font-medium" style={{ color: '#A59582' }}>
                                    Deployed {format(new Date(mappedUser.created_at), 'MMM do, yyyy')}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            {/* ── Authorization badge ── */}
                            <TableCell className="px-6 h-16 border-r" style={{ borderColor: '#F0EAE0' }}>
                              <span
                                className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${mappedUserRole === 'owner'
                                  ? 'bg-violet-50 text-violet-600 border border-violet-200'
                                  : mappedUserRole === 'moderator'
                                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                    : mappedUserRole === 'manager'
                                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                      : 'bg-[rgba(197,168,128,0.08)] border border-[#E3DAC9]'
                                  }`}
                                style={mappedUserRole === 'member' ? { color: '#8C7654' } : {}}
                              >
                                {getRoleBadgeLabel(mappedUserRole)}
                              </span>
                            </TableCell>

                            {/* ── Hive toggle ── */}
                            <TableCell className="px-6 h-16 border-r" style={{ borderColor: '#F0EAE0' }}>
                              <div className="flex items-center gap-2.5">
                                {hiveToggleLoading === mappedUser.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#C5A880' }} />
                                ) : (
                                  <Switch
                                    checked={hiveAccessMap[mappedUser.id] ?? false}
                                    onCheckedChange={() =>
                                      handleHiveToggle(mappedUser.id, hiveAccessMap[mappedUser.id] ?? false)
                                    }
                                    disabled={userRole !== 'owner'}
                                    className={cn(
                                      'data-[state=checked]:bg-emerald-500',
                                      userRole !== 'owner' && 'opacity-40 cursor-not-allowed'
                                    )}
                                  />
                                )}
                                <span
                                  className={cn(
                                    'text-[10px] font-bold uppercase tracking-wider',
                                    hiveAccessMap[mappedUser.id] ? 'text-emerald-600' : 'text-muted-foreground/40'
                                  )}
                                >
                                  {hiveAccessMap[mappedUser.id] ? 'On' : 'Off'}
                                </span>
                              </div>
                            </TableCell>

                            {/* ── Role change ── */}
                            <TableCell className="px-6 h-16 border-r text-center" style={{ borderColor: '#F0EAE0' }}>
                              <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    disabled={userRole !== 'owner' || mappedUser.id === user?.id}
                                    className="w-32 h-9 px-3 flex justify-between items-center rounded-md border text-[10px] font-bold uppercase tracking-wide bg-[#FDFDFB] text-[#2C241B] hover:bg-[#FAF9F5] hover:text-[#2C241B] disabled:opacity-50 transition-colors"
                                    style={{ borderColor: '#E3DAC9' }}
                                  >
                                    <span>{mappedUserRole}</span>
                                    <ChevronDown className="h-3.5 w-3.5 opacity-50 ml-2" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  className="w-32 border shadow-xl rounded-xl p-1 z-50"
                                  style={{ borderColor: '#E3DAC9', background: '#FDFDFB' }}
                                >
                                  {(['member', 'manager', 'moderator', 'owner'] as const).map((roleOption) => (
                                    <DropdownMenuItem
                                      key={roleOption}
                                      onClick={() => handleRoleChange(mappedUser.id, roleOption)}
                                      className="rounded-lg focus:bg-[#FAF9F5] focus:text-[#2C241B] cursor-pointer py-1.5"
                                    >
                                      <span
                                        className={`text-[10px] font-bold uppercase tracking-wide ${mappedUserRole === roleOption ? 'text-[#8C7654]' : 'text-[#2C241B]'
                                          }`}
                                      >
                                        {roleOption}
                                      </span>
                                      {mappedUserRole === roleOption && (
                                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#8C7654]" />
                                      )}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>

                            {/* ── Ban / Unban ── */}
                            <TableCell className="px-6 h-16 border-r text-center" style={{ borderColor: '#F0EAE0' }}>
                              {userRole === 'owner' && mappedUser.id !== user?.id ? (
                                <Button
                                  variant="outline"
                                  onClick={() => handleBanToggle(mappedUser)}
                                  disabled={banToggleLoading === mappedUser.id}
                                  className={`h-9 rounded-xl px-3 text-[10px] font-bold uppercase tracking-wide transition-colors ${mappedUser.is_banned
                                    ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                                    : 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'
                                    }`}
                                >
                                  {banToggleLoading === mappedUser.id && (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  )}
                                  {mappedUser.is_banned ? 'Unban' : 'Ban'}
                                </Button>
                              ) : (
                                <span className="text-[10px] text-muted-foreground/40"><Badge
                                  className={`h-5 px-2 text-[8px] uppercase tracking-wider ${mappedUser.is_banned
                                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-50'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                                    }`}
                                >
                                  <span
                                    className={`mr-1 h-1.5 w-1.5 rounded-full ${mappedUser.is_banned ? 'bg-red-500' : 'bg-emerald-500'
                                      }`}
                                  />
                                  {mappedUser.is_banned ? 'Banned' : 'Active'}
                                </Badge></span>
                              )}
                            </TableCell>

                            {/* ── Delete ── */}
                            <TableCell className="px-6 h-16 text-right">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => {
                                  setUserToDelete(mappedUser);
                                  setIsDeleteDialogOpen(true);
                                }}
                                disabled={!canDeleteUser(mappedUser)}
                                className="w-9 h-9 rounded-xl  transition-all hover:scale-105 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                style={{ color: '#C0392B' }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="border-0 rounded-2xl p-0 max-w-md overflow-hidden shadow-2xl">
          <div className="px-8 pt-8 pb-6 relative" style={{ background: 'linear-gradient(135deg, #2C241B 0%, #4A3C2E 100%)' }}>
            <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(circle at 70% 30%, #C0392B, transparent 60%)' }} />
            <DialogHeader>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)' }}>
                <AlertCircle className="w-6 h-6" style={{ color: '#C0392B' }} />
              </div>
              <DialogTitle className="text-xl font-bold" style={{ color: '#FDFDFB' }}>Terminate Entity?</DialogTitle>
              <DialogDescription className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Delete <strong style={{ color: '#FDFDFB' }}>{userToDelete?.full_name || userToDelete?.email}</strong>?
                This action is irreversible.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-8 py-6 flex justify-end gap-3" style={{ background: '#FDFDFB' }}>
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} disabled={actionLoading}
              className="rounded-full px-6 h-10 text-xs font-bold uppercase tracking-widest border transition-all"
              style={{ color: '#8C7654', borderColor: '#E3DAC9' }}
            >
              Keep It
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={actionLoading}
              className="rounded-full px-8 h-10 text-xs font-bold uppercase tracking-widest border-0 shadow-lg transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #C0392B, #96281B)', color: '#FDFDFB' }}
            >
              {actionLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Terminate Access
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;