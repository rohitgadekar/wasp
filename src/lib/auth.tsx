import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithPasskey: () => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  registerPasskey: () => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: error.message,
      });
    }
    
    return { error };
  };

  const signInWithPasskey = async () => {
    const authAny = supabase.auth as any;

    if (typeof authAny.signInWithPasskey !== 'function') {
      const error = new Error('Passkeys are not supported by your current @supabase/supabase-js package version.');
      toast({
        variant: "destructive",
        title: "Passkeys unavailable",
        description: error.message,
      });
      return { error };
    }

    const { error } = await authAny.signInWithPasskey();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error signing in with passkey",
        description: error.message,
      });
    }

    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error signing up",
        description: error.message,
      });
    } else {
      toast({
        title: "Account created!",
        description: "You can now sign in with your credentials.",
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  const registerPasskey = async () => {
    if (!window.isSecureContext || !('credentials' in navigator)) {
      const error = new Error('Passkeys require HTTPS (or localhost) and a WebAuthn-capable browser.');
      toast({
        variant: "destructive",
        title: "Passkeys unavailable",
        description: error.message,
      });
      return { error };
    }

    const authAny = supabase.auth as any;

    if (typeof authAny.registerPasskey !== 'function') {
      const error = new Error('Passkeys require @supabase/supabase-js v2.105.0+ and a restarted dev server. Stop Vite, clear node_modules/.vite, then start with --force.');
      toast({
        variant: "destructive",
        title: "Passkeys unavailable",
        description: error.message,
      });
      return { error };
    }

    const { error } = await authAny.registerPasskey();

    if (error) {
      toast({
        variant: "destructive",
        title: "Passkey registration failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Passkey added",
        description: "You can now sign in with this passkey.",
      });
    }

    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signInWithPasskey, signUp, signOut, registerPasskey, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}