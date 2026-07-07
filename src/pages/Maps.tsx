import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ExternalLink, Search, Loader2, CircleUser, Diff, X, Link2, FileText, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTitle } from '@/hooks/use-title';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Ticket {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  jira_link: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
    avatar?: string | null;
  };
}

const Maps = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jira_link: '',
  });

  useTitle('Tickets Directory');

  const { user } = useAuth();
  const { isSuperUser } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading: loading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, profiles (full_name, email, avatar)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Ticket[];
    },
  });

  useEffect(() => {
    if (!isDialogOpen && !isDeleteDialogOpen) {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
    }
  }, [isDialogOpen, isDeleteDialogOpen]);

  useEffect(() => {
    const channel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' },
        () => queryClient.invalidateQueries({ queryKey: ['tickets'] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const filteredTickets = useMemo(() => {
    if (searchQuery.trim() === '') return tickets;
    const query = searchQuery.toLowerCase();
    return tickets.filter(
      (ticket) =>
        ticket.title.toLowerCase().includes(query) ||
        ticket.description?.toLowerCase().includes(query)
    );
  }, [searchQuery, tickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    if (editingTicket) {
      const { error } = await supabase.from('tickets').update({
        title: formData.title,
        description: formData.description,
        jira_link: formData.jira_link,
      }).eq('id', editingTicket.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Error updating ticket', description: error.message });
        setActionLoading(false);
        return;
      }
      toast({ title: 'Ticket updated successfully!' });
    } else {
      const { error } = await supabase.from('tickets').insert({
        user_id: user?.id,
        title: formData.title,
        description: formData.description,
        jira_link: formData.jira_link,
      });

      if (error) {
        toast({ variant: 'destructive', title: 'Error creating ticket', description: error.message });
        setActionLoading(false);
        return;
      }
      toast({ title: 'Ticket created successfully!' });
    }

    setActionLoading(false);
    setFormData({ title: '', description: '', jira_link: '' });
    setEditingTicket(null);
    setIsDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
  };

  const handleEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description || '',
      jira_link: ticket.jira_link || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!ticketToDelete) return;
    setActionLoading(true);
    const { error } = await supabase.from('tickets').delete().eq('id', ticketToDelete.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting ticket', description: error.message });
      setActionLoading(false);
      return;
    }
    toast({ title: 'Ticket deleted successfully!' });
    setActionLoading(false);
    setIsDeleteDialogOpen(false);
    setTicketToDelete(null);
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
  };

  const canEdit = (ticket: Ticket) => isSuperUser || ticket.user_id === user?.id;

  const inputClasses = "h-12 pl-11 pr-4 bg-white/40 border border-[#E3DAC9] rounded-md font-sans text-sm text-[#2C241B] placeholder:text-[#A59582]/30 focus-visible:ring-0 focus-visible:border-2 focus-visible:border-[#C5A880] transition-all";
  const labelClasses = "text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#8C7654] ml-1 mb-1.5 block";

  return (
    <div className="relative min-h-screen">
      <div className="relative space-y-16 mx-auto p-6 md:p-12 max-w-[1400px] py-20 z-10">

        {/* Editorial Header */}
        <div className="text-center flex flex-col items-center justify-center space-y-4">
          <Badge className="bg-[#C5A880]/10 text-[#8C7654] border border-[#E5DCCB] rounded-full px-6 py-1.5 uppercase tracking-[0.3em] text-[10px] font-sans font-bold mx-auto block w-fit shadow-sm">
            Jira / Tickets Directory
          </Badge>
        </div>

        {/* Premium Action Bar */}
        <div className="flex flex-col md:flex-row gap-6 items-center w-full">
          {/* Search */}
          <div className="relative flex-1 w-full bg-[#FDFDFB] rounded-[2rem] border border-[#E5DCCB] shadow-[0_15px_30px_rgba(197,168,128,0.1)] transition-all duration-500 focus-within:border-[#C5A880] focus-within:shadow-[0_20px_40px_rgba(197,168,128,0.2)] overflow-hidden">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A59582] transition-colors z-10" />
            <Input
              placeholder="Search ticket directory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent pl-14 pr-14 h-16 text-lg border-none focus-visible:ring-0 focus-visible:ring-offset-0 outline-none w-full font-sans text-[#2C241B] placeholder:text-[#A59582]/50"
            />
            {searchQuery && (
              <Button variant="ghost" size="icon" onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 text-[#8C7654] hover:bg-[#C5A880]/15 hover:text-[#2C241B] transition-all active:scale-95">
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Dialog Trigger */}
          <Dialog
            modal={false}
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) { setEditingTicket(null); setFormData({ title: '', description: '', jira_link: '' }); }
            }}
          >
            <DialogTrigger asChild>
              <Button className="rounded-[2rem] px-10 h-16 bg-[#2C241B] hover:bg-[#38322D] text-[#EFEAE2] font-sans font-bold tracking-[0.15em] text-xs uppercase shadow-xl hover:-translate-y-1 active:scale-95 group transition-all shrink-0">
                <Plus className="mr-3 h-5 w-5 transition-transform group-hover:rotate-90 text-[#C5A880]" />
                Issue Intelligence
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
                      {editingTicket ? 'Refinement Mode' : 'Reference Mode'}
                    </div>
                    <DialogTitle className="text-2xl font-sans font-semibold text-[#EFEAE2] tracking-wide leading-tight">
                      {editingTicket ? 'Refine Reference' : 'New Issue Reference'}
                    </DialogTitle>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C5A880]/50 to-transparent" />
              </div>

              {/* Form Body */}
              <div className="flex-1 overflow-y-auto px-8 custom-scrollbar bg-[#FDFDFB]">
                <form id="ticketForm" onSubmit={handleSubmit} className="space-y-6 mt-6 pb-6">

                  <div className="grid gap-2">
                    <Label htmlFor="title" className={labelClasses}>Document Identifier</Label>
                    <div className="relative group/field">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A59582] group-focus-within/field:text-[#8C7654] transition-colors" />
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        placeholder="e.g. AUTHENTICATION MODULE REFACTOR"
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description" className={labelClasses}>Intellectual Summary</Label>
                    <div className="relative group/field">
                      <FileText className="absolute left-4 top-3.5 w-4 h-4 text-[#A59582] group-focus-within/field:text-[#8C7654] transition-colors" />
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        placeholder="Describe the operational scope of this reference..."
                        className="pl-11 pr-4 py-3 rounded-md border border-[#E3DAC9] bg-white/40 focus-visible:ring-0 focus-visible:border-2 focus-visible:border-[#C5A880] font-sans text-sm text-[#2C241B] placeholder:text-[#A59582]/30 leading-relaxed resize-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="jira_link" className={labelClasses}>External Logic Link (Jira)</Label>
                    <div className="relative group/field">
                      <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A59582] group-focus-within/field:text-[#8C7654] transition-colors" />
                      <Input
                        id="jira_link"
                        type="url"
                        placeholder="https://jira.example.com/browse/PROJ-123"
                        value={formData.jira_link}
                        onChange={(e) => setFormData({ ...formData, jira_link: e.target.value })}
                        className={inputClasses}
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-8 py-5 bg-[#FAF9F5] border-t border-[#E5DCCB] flex items-center justify-between">
                <span className="text-[9px] font-sans font-bold tracking-[0.25em] uppercase text-[#A59582]">Eagle Labs Infrastructure</span>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="ghost"
                    className="h-10 px-6 rounded-lg font-sans font-bold uppercase text-[10px] tracking-[0.15em] text-[#8C7654] hover:text-[#2C241B] hover:bg-[#E5DCCB]/40 transition-all"
                    onClick={() => { setIsDialogOpen(false); setEditingTicket(null); setFormData({ title: '', description: '', jira_link: '' }); }}>
                    Discard
                  </Button>
                  <Button type="submit" form="ticketForm" disabled={actionLoading}
                    className="h-10 px-8 rounded-lg bg-[#2C241B] hover:bg-[#38322D] text-[#EFEAE2] font-sans font-bold uppercase text-[10px] tracking-[0.15em] shadow-md border border-[#C5A880]/20 hover:border-[#C5A880]/50 transition-all hover:scale-105 active:scale-95">
                    {actionLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-[#C5A880]" />}
                    {editingTicket ? 'Sync Update' : 'Establish Node'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tickets Grid */}
        <div className="grid gap-8">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-3xl bg-[#E5DCCB]/20 animate-pulse border border-[#E5DCCB]/50" />
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <Card className="bg-[#FAF9F5] border border-dashed border-[#E5DCCB] rounded-[2rem] shadow-none">
              <CardContent className="py-24 text-center">
                <div className="bg-[#C5A880]/10 border border-[#E5DCCB] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-10 w-10 text-[#C5A880]" />
                </div>
                <h3 className="text-2xl font-sans font-semibold tracking-wide text-[#2C241B] mb-2">Void in the Archive</h3>
                <p className="text-[#7A6E5D] font-serif italic text-lg max-w-sm mx-auto">
                  {tickets.length === 0
                    ? 'The directory is empty. Start by adding a ticket reference.'
                    : "We couldn't find any tickets matching your search."}
                </p>
                {searchQuery && (
                  <Button variant="link" onClick={() => setSearchQuery('')} className="mt-6 text-[#8C7654] font-sans font-bold uppercase tracking-widest text-[10px] hover:text-[#2C241B]">
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="bg-[#FDFDFB] rounded-[2rem] border border-[#E5DCCB] hover:border-[#C5A880]/50 transition-all duration-500 hover:shadow-2xl hover:shadow-[#C5A880]/10 group flex flex-col overflow-hidden min-h-[360px] max-h-[420px] relative">

                  {/* Hover action buttons */}
                  {canEdit(ticket) && (
                    <div className="absolute top-5 right-5 flex gap-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button size="icon" variant="ghost"
                        className="h-9 w-9 rounded-full bg-[#FAF9F5] border border-[#E5DCCB]/60 text-[#8C7654] hover:bg-[#C5A880]/15 hover:text-[#2C241B] shadow-sm"
                        onClick={(e) => { e.stopPropagation(); handleEdit(ticket); }}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost"
                        className="h-9 w-9 rounded-full bg-[#FAF9F5] border border-[#E5DCCB]/60 text-[#8C2B2B]/70 hover:bg-[#8C2B2B]/10 hover:text-[#8C2B2B] shadow-sm"
                        onClick={(e) => { e.stopPropagation(); setTicketToDelete(ticket); setIsDeleteDialogOpen(true); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  <CardHeader className="p-6 pb-3 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-3 flex-wrap pr-16">
                      <Badge className="bg-[#C5A880]/15 text-[#8C7654] border-none px-3 py-1 rounded-full text-[9px] font-sans font-bold tracking-[0.2em] uppercase">
                        Jira Ticket
                      </Badge>
                      <div className="h-1 w-1 rounded-full bg-[#E5DCCB]" />
                      <span className="text-[10px] font-sans font-bold text-[#A59582] uppercase tracking-[0.15em]">
                        {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>

                    <CardTitle className="text-xl font-sans font-semibold text-[#2C241B] group-hover:text-[#94764D] transition-colors leading-snug break-words">
                      {ticket.title}
                    </CardTitle>

                    {/* Contributor row */}
                    <div className="flex items-center gap-2.5 mt-3">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#E2D4BF] to-[#997C53] flex items-center justify-center border border-[#F0E6D2] overflow-hidden p-[1px] flex-shrink-0">
                        <div className="w-full h-full bg-[#FDFDFB] rounded-full overflow-hidden flex items-center justify-center">
                          {ticket.profiles?.avatar
                            ? <img src={ticket.profiles.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            : <CircleUser className="h-4 w-4 text-[#C5A880]" />}
                        </div>
                      </div>
                      <span className="text-[10px] font-sans font-bold text-[#8C7654] tracking-wide truncate">
                        {ticket.profiles?.full_name || ticket.profiles?.email || 'Unknown Author'}
                      </span>
                      {ticket.updated_at !== ticket.created_at && (
                        <>
                          <div className="h-1 w-1 rounded-full bg-[#E5DCCB] flex-shrink-0" />
                          <span className="text-[9px] font-sans font-bold text-[#A59582] uppercase tracking-widest flex items-center flex-shrink-0">
                            <Diff className="h-3 w-3 mr-1 text-[#C5A880]" />
                            Revised {format(new Date(ticket.updated_at), 'MMM d')}
                          </span>
                        </>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-2 flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                      {ticket.description && (
                        <p className="text-[#5C5040] font-sans text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {ticket.description}
                        </p>
                      )}
                    </div>

                    {ticket.jira_link && (
                      <div className="mt-4 pt-4 border-t border-[#E5DCCB]/60 flex-shrink-0">
                        <a
                          href={ticket.jira_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[11px] font-sans font-bold text-[#8C7654] hover:text-[#2C241B] group/link transition-colors uppercase tracking-[0.15em]"
                        >
                          <span className="relative">
                            Open in Jira
                            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#C5A880] group-hover/link:w-full transition-all duration-300" />
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform text-[#C5A880]" />
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog modal={false} open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#FDFDFB] border border-[#E5DCCB] rounded-[2.5rem] p-8 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-cinzel font-semibold tracking-wide text-[#2C241B]">Delete Ticket?</DialogTitle>
            <DialogDescription className="text-lg font-serif italic text-[#7A6E5D] mt-2">
              Are you sure you want to delete <span className="text-[#2C241B] font-bold not-italic">"{ticketToDelete?.title}"</span>? This action <span className="text-[#8C2B2B] font-bold underline">cannot be undone</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-4 mt-8">
            <Button variant="ghost"
              className="rounded-full px-8 h-12 font-sans font-bold uppercase text-[10px] tracking-[0.15em] text-[#8C7654] hover:text-[#2C241B] hover:bg-[#E5DCCB]/30 transition-all"
              onClick={() => setIsDeleteDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button className="rounded-full px-8 h-12 bg-[#8C2B2B] hover:bg-[#722121] text-white font-sans font-bold uppercase text-[10px] tracking-[0.15em] shadow-lg transition-all"
              onClick={handleDelete} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Maps;