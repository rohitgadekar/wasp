import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export const useUserRole = () => {
  const [role, setRole] = useState<'member' | 'moderator' | 'owner' | 'manager' | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRole = async () => {
      if (!user?.id) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setRole(data.role as 'member' | 'moderator' | 'owner' | 'manager');
      }
      setLoading(false);
    };

    fetchRole();
  }, [user]);

  return {
    role,
    loading,
    isSuperUser: role === 'moderator' || role === 'owner' || role === 'manager',
    isOwner: role === 'owner',
    isManager: role === 'manager',
    canManageLeaves: role === 'manager' || role === 'owner'
  };
};
