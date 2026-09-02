import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F5F0]">
        <div className="w-72">
          {/* Embossed track */}
          <div
            className="
          relative h-[6px] w-full overflow-hidden rounded-full
          bg-[#EDE6DB]
          shadow-[inset_0_1px_2px_rgba(0,0,0,0.08),inset_0_-1px_1px_rgba(255,255,255,0.6)]
        "
          >
            {/* Soft ambient glow */}
            <div className="absolute inset-y-0 left-0 w-[38%] rounded-full bg-[#C9A66B]/20 blur-[5px] animate-loading-bar" />

            {/* Main embossed bar */}
            <div
              className="
            absolute inset-y-[1px] left-0 w-[38%] rounded-full
            bg-gradient-to-b from-[#E8C992] via-[#C9A66B] to-[#B8925A]
            shadow-[0_1px_2px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.45)]
            animate-loading-bar
          "
            />

            {/* Top highlight edge */}
            <div
              className="
            absolute top-[1px] left-0 h-[1.5px] w-[38%] rounded-full
            bg-gradient-to-r from-transparent via-white/60 to-transparent
            animate-loading-bar
          "
            />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    const redirectTarget = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to={`/auth?redirect=${encodeURIComponent(redirectTarget)}`}
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
