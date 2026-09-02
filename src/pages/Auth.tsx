import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { SiChinaeasternairlines } from "react-icons/si";

import { Mail, Lock, Sparkles, Loader2, Fingerprint } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { signIn, signInWithPasskey, user } = useAuth();

  // Determine safe redirect destination
  const redirectParam = searchParams.get('redirect');
  const stateFrom = (location.state as any)?.from;
  const rawTarget =
    redirectParam ||
    (stateFrom
      ? `${stateFrom.pathname || ''}${stateFrom.search || ''}${stateFrom.hash || ''}`
      : '/');

  const destination =
    rawTarget && rawTarget.startsWith('/') && !rawTarget.startsWith('//')
      ? rawTarget
      : '/';

  useEffect(() => {
    if (user) {
      navigate(destination, { replace: true });
    }
  }, [user, navigate, destination]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (!error) {
      navigate(destination, { replace: true });
    }
    setIsLoading(false);
  };

  const handlePasskeySignIn = async () => {
    setIsLoading(true);
    const { error } = await signInWithPasskey();
    if (!error) {
      navigate(destination, { replace: true });
    }
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-tr from-[#FAF9F5] via-[#FDFDFB] to-[#F3EEE3] overflow-hidden select-none">
      {/* Royale Luxury Light-Theme Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-[#E8DEC9]/35 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-[#DFD0B8]/20 rounded-full blur-[160px]" />
        {/* Fine luxury linen canvas grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23C5A880'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-[1.1fr_auto_0.9fr] items-center gap-12 md:gap-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {/* Left Column: Heading */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-10 group">
          <div className="relative inline-block">
            {/* Medallion Aura */}
            <div className="absolute inset-0 bg-[#C5A880]/15 rounded-full blur-xl group-hover:scale-125 transition-transform duration-1000" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#E2D4BF] via-[#BFA378] to-[#997C53] flex items-center justify-center border border-[#F0E6D2] shadow-xl transition-all duration-700 group-hover:rotate-12">
              <div className="absolute inset-1 rounded-full border border-white/30" />
              <SiChinaeasternairlines className="text-white drop-shadow-md relative z-10" size={32} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="border border-[#C5A880]/30 text-[#8C7654] bg-[#C5A880]/8 rounded-full px-5 py-1.5 uppercase tracking-[0.25em] text-[9px] font-sans font-semibold w-fit mx-auto md:mx-0">
              Intelligence, Engineered
            </div>
            <h1 className="text-8xl md:text-9xl font-cinzel font-medium tracking-[0.08em] bg-clip-text text-transparent bg-gradient-to-r from-[#2C241B] via-[#94764D] to-[#2C241B] leading-none select-none [text-shadow:2px_2px_0px_rgba(44,36,27,0.18),4px_4px_8px_rgba(44,36,27,0.25)]">
              WASP
            </h1>
            <div className="space-y-2">
              <p className="text-2xl md:text-3xl font-serif italic text-[#5C5040] tracking-wide ">
                Architectural Intelligence Suite
              </p>
              <p className="text-[9px] font-sans tracking-[0.35em] font-semibold text-[#A59582] uppercase">
                Proprietary Eagle Labs Infrastructure
              </p>
            </div>
          </div>

          {/* Secure Handshake & Monitor Metrics */}
          <div className="hidden md:flex flex-col gap-4 pt-10 border-t border-[#E5DCCB]/60 w-full">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl    space-y-1.5 shadow-xs transition-all duration-300 hover:shadow-sm">
                <p className="text-[#8C7654] font-semibold font-sans text-[10px] tracking-wider uppercase">ENCRYPTED</p>
                <p className="text-[10px] text-[#7A6E5D] leading-relaxed font-sans">Post-quantum secure handshake protocols active.</p>
              </div>
              <div className="p-4 rounded-xl  space-y-1.5 shadow-xs transition-all duration-300 hover:shadow-sm">
                <p className="text-[#8C7654] font-semibold font-sans text-[10px] tracking-wider uppercase">MONITORED</p>
                <p className="text-[10px] text-[#7A6E5D] leading-relaxed font-sans">Real-time contribution logging and verification.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:flex items-center justify-center h-[450px]">
          <div className="w-px h-full bg-gradient-to-b from-transparent via-[#C5A880]/30 to-transparent relative">

            <div
              className="
        absolute top-1/2 left-1/2
        -translate-x-1/2 -translate-y-1/2
        w-10 h-10 rounded-full

        bg-gradient-to-br from-[#FDFDFB] via-[#FAF9F5] to-[#E8DDCB]

        border border-[#D8C9B0]

        shadow-
        [-4px_-4px_8px_rgba(255,255,255,0.95),6px_6px_10px_rgba(44,36,27,0.18),inset_-2px_-2px_4px_rgba(148,118,77,0.12),inset_2px_2px_4px_rgba(255,255,255,0.9)]

        flex items-center justify-center
      "
            >
              <div
                className="
          w-3 h-3 rounded-full
          bg-gradient-to-br from-[#E4CFA8] to-[#94764D]
          border border-[#B99A6A]
          shadow-[-1px_-1px_2px_rgba(255,255,255,0.8),2px_2px_4px_rgba(44,36,27,0.3)]
        "
              />
            </div>

          </div>
        </div>

        {/* Right Column: Authentication Card with Double Frame */}
        <div className="w-full">
          <div className="p-3 bg-[#FAF8F5]  rounded-[2.5rem]  shadow-2xl">
            <div className="backdrop-blur-sm  rounded-[2rem] overflow-hidden">
              <CardHeader className="p-8">
                <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2.5">
                  <CardTitle className="text-2xl font-heading uppercase font-medium tracking-[0.05em] text-[#2C241B]">
                    Identity Verification
                  </CardTitle>
                  <CardDescription className="text-[9px] font-sans font-bold tracking-[0.18em] uppercase text-[#A59582]">
                    Authorized Personnel Only • Encrypted Node Entry
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="">
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-5">
                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-[9px] font-sans font-bold tracking-[0.2em] text-[#8C7654] uppercase ml-1">
                        Node Identifier
                      </Label>
                      <div className="relative group/field">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A59582] group-focus-within/field:text-[#8C7654] transition-colors" />
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="ENTER ACCESS EMAIL"
                          className="h-12 pl-12 pr-4 bg-white/40 border border-[#E3DAC9] rounded-md font-sans text-sm text-[#2C241B] placeholder:text-[#A59582]/30 focus-visible:ring-1 focus-visible:ring-[#C5A880] focus-visible:border-[#C5A880] transition-all"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          required
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-[9px] font-sans font-bold tracking-[0.2em] text-[#8C7654] uppercase ml-1">
                        Security Cipher
                      </Label>
                      <div className="relative group/field">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A59582] group-focus-within/field:text-[#8C7654] transition-colors" />
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="••••••••••••"
                          className="h-12 pl-12 pr-4 bg-white/40 border border-[#E3DAC9] rounded-md font-sans text-sm text-[#2C241B] placeholder:text-[#A59582]/30 focus-visible:ring-1 focus-visible:ring-[#C5A880] focus-visible:border-[#C5A880] transition-all"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <Button
                      type="submit"
                      className="w-full h-14 rounded-md bg-[#231F1C] hover:bg-[#38322D] text-[#EFEAE2] font-sans font-semibold tracking-[0.25em] text-[10px] uppercase shadow-lg shadow-[#231F1C]/10 border border-[#C5A880]/30 hover:border-[#C5A880] hover:scale-[1.01] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#EFEAE2]" />
                      ) : (
                        <span className="flex items-center gap-2">
                          Initialize Session
                        </span>
                      )}
                    </Button>

                    <Button
                      type="button"
                      // variant="outline"
                      onClick={handlePasskeySignIn}
                      className="w-full h-12 rounded-md bg-white/40 border border-[#E3DAC9] hover:bg-[#FAF8F5] hover:text-[#8C7654] text-[#2C241B] font-sans font-semibold tracking-[0.18em] text-[10px] uppercase transition-all duration-300 flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      <Fingerprint className="w-4 h-4 text-[#8C7654]" />
                      Sign in with passkey
                    </Button>

                    <div className="flex items-center justify-center gap-2 py-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#C5A880] animate-pulse" />
                      <span className="text-[9px] font-sans font-bold tracking-[0.12em] uppercase text-[#A59582]">
                        Secure Handshake Active
                      </span>
                    </div>
                  </div>
                </form>
              </CardContent>

              {/* Bottom luxury branding stripe */}
              <div className="p-6 bg-[#FAF8F5] border-t border-[#EAE2D5] text-center space-y-2">
                <p className="text-[8px] font-sans font-bold uppercase tracking-[0.3em] text-[#A59582] leading-relaxed">
                  Proprietary Technology • Powered by Eagle Labs
                </p>
                <div className="flex items-center justify-center gap-4 text-[10px] font-sans text-[#8C7654] font-medium">
                  <Link to="/privacy" className="hover:text-[#2C241B] transition-colors underline underline-offset-2">
                    Privacy Policy
                  </Link>
                  <span className="text-[#C5A880]">•</span>
                  <Link to="/terms" className="hover:text-[#2C241B] transition-colors underline underline-offset-2">
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
