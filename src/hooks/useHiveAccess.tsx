import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export const useHiveAccess = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['hive_access', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hive_access')
        .select('enabled')
        .eq('user_id', user!.id)
        .single();

      if (error) return false;
      return data?.enabled ?? false;
    },
    enabled: !!user,
  });

  return {
    hasAccess: data ?? false,
    loading: isLoading,
  };
};
