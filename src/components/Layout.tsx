import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Code2, TrendingUp, Users, FileText, BookOpen, ChevronDown, Calendar, Trophy, MapPin, User, FolderPen, LogOut, Terminal, Table2, GitCompare, Wrench, FileCode2, Search, Sparkles, Puzzle } from 'lucide-react';
import { NavLink } from './NavLink';
import { useUserRole } from '@/hooks/useUserRole';
import { useHiveAccess } from '@/hooks/useHiveAccess';
import { OnlineUsers } from './OnlineUsers';
import { QuickLinks } from './QuickLinks';
import { NyraFloatingButton } from './NyraFloatingButton';
import { RiRobot3Fill } from "react-icons/ri";
import { TbTableSpark } from "react-icons/tb";
import { GiWaspSting } from "react-icons/gi";
import { PiGitDiffBold } from "react-icons/pi";
import { SiJira } from "react-icons/si";
import { FarewellBanner } from './FarewellBanner';
import { SiChinaeasternairlines } from "react-icons/si";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth();
  const { isSuperUser, role } = useUserRole();
  const { hasAccess: hasHiveAccess } = useHiveAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const [showBanner, setShowBanner] = useState(false);

  const toolsItems = [
    { to: '/csv-visualizer', icon: Table2, label: 'CSV Visualizer', description: 'Data Table Inspection' },
    { to: '/map-generator', icon: FolderPen, label: 'Map Name Generator', description: 'Generate Map Name' },
    { to: '/document-finder', icon: Search, label: 'Document Finder', description: 'Search EDI Documents' },
    ...(hasHiveAccess ? [{ to: '/hive', icon: Puzzle, label: 'Hive', description: 'Chrome Extension' }] : []),
  ];

  const isToolsActive = toolsItems.some(item => location.pathname === item.to);

  return (
    <div className="flex min-h-screen flex-col select-none">
      <header className="fixed top-4 left-0 right-0 z-50 px-6 transition-all duration-500 ease-out">
        <div className="container mx-auto">
          <div className="rounded-[2.5rem] px-8 py-3 flex items-center justify-between shadow-[0_20px_40px_rgba(197,168,128,0.15)] backdrop-blur-2xl bg-[#FDFDFB]/85 border border-[#E5DCCB] transition-all duration-500 ease-out hover:shadow-[0_25px_50px_rgba(197,168,128,0.2)] hover:bg-[#FDFDFB]/95">
            <div className="flex items-center gap-12">
              {/* Logo Area */}
              <div
                className="flex items-center gap-4 -ml-2 cursor-pointer group"
                onClick={() => navigate('/')}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#E2D4BF] via-[#BFA378] to-[#997C53] shadow-lg shadow-[#C5A880]/30 group-hover:rotate-12 transition-all duration-700 ease-out border border-[#F0E6D2] relative transform-gpu">
                  <div className="absolute inset-1 rounded-full border border-white/40" />
                  <SiChinaeasternairlines className="h-6 w-6 text-white drop-shadow-md relative z-10" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-2xl font-cinzel font-semibold tracking-[0.1em] bg-clip-text text-transparent bg-gradient-to-r from-[#2C241B] via-[#94764D] to-[#2C241B]">WASP</span>
                  <span className="text-[9px] font-sans font-bold text-[#8C7654] tracking-[0.25em] uppercase mt-1">SIGNED BUILD</span>
                </div>
              </div>

              {/* Navigation */}
              <nav className="hidden xl:flex items-center gap-3">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-full px-5 py-2.5 h-auto flex items-center gap-2 text-[11px] font-sans font-bold uppercase tracking-[0.15em] transition-all duration-500 ease-out hover:scale-105 transform-gpu ${['/', '/wiki', '/scripts', '/maps', '/ai-agent'].includes(location.pathname)
                        ? 'bg-[#2C241B] text-[#EFEAE2] shadow-lg shadow-[#2C241B]/15 hover:bg-[#38322D]'
                        : 'text-[#5C5040] hover:bg-[#C5A880]/10 hover:text-[#2C241B]'
                        }`}
                    >
                      <Code2 className="h-4 w-4" />
                      Ecosystem
                      <ChevronDown className={cn("h-3 w-3 transition-transform duration-500 ease-out", ['/', '/wiki', '/scripts', '/maps', '/ai-agent'].includes(location.pathname) && "rotate-180")} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="bg-[#FDFDFB]/95 backdrop-blur-xl border border-[#E5DCCB] rounded-3xl p-3 min-w-[280px] shadow-[0_30px_90px_rgba(197,168,128,0.18)] animate-in zoom-in-95 fade-in-0 duration-300">
                    {[
                      { to: '/', icon: Code2, label: 'Library', description: 'Code Asset Repository' },
                      { to: '/wiki', icon: BookOpen, label: 'Wiki', description: 'Documentation & Guides' },
                      { to: '/scripts', icon: Terminal, label: 'Scripts', description: 'Automated utilities' },
                      { to: '/maps', icon: SiJira, label: 'Maps', description: 'Reference Maps Library' },
                    ].map((item) => (
                      <DropdownMenuItem key={item.to} asChild className="rounded-2xl focus:bg-[#FAF8F5] p-3 transition-all duration-500 ease-out group cursor-pointer border border-transparent hover:border-[#E5DCCB]/50 transform-gpu">
                        <NavLink to={item.to} className="flex items-start gap-4 w-full">
                          <div className="bg-[#C5A880]/10 text-[#8C7654] p-2.5 rounded-xl group-hover:bg-gradient-to-br group-hover:from-[#E2D4BF] group-hover:via-[#BFA378] group-hover:to-[#997C53] group-hover:text-white transition-all duration-500 ease-out shadow-sm group-hover:scale-110">
                            <item.icon className="h-4 w-4 drop-shadow-sm" />
                          </div>
                          <div className="flex flex-col gap-1 mt-0.5">
                            <span className="font-sans font-bold text-sm tracking-wide text-[#2C241B] group-hover:text-[#94764D] transition-colors duration-500">{item.label}</span>
                            <span className="text-[10px] font-sans font-medium text-[#A59582]">{item.description}</span>
                          </div>
                        </NavLink>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-full px-5 py-2.5 h-auto flex items-center gap-2 text-[11px] font-sans font-bold uppercase tracking-[0.15em] transition-all duration-500 ease-out hover:scale-105 transform-gpu ${['/status', '/leaderboard', '/leaves'].includes(location.pathname)
                        ? 'bg-[#2C241B] text-[#EFEAE2] shadow-lg shadow-[#2C241B]/15 hover:bg-[#38322D]'
                        : 'text-[#5C5040] hover:bg-[#C5A880]/10 hover:text-[#2C241B]'
                        }`}
                    >
                      <TrendingUp className="h-4 w-4" />
                      Operations
                      <ChevronDown className={cn("h-3 w-3 transition-transform duration-500 ease-out", ['/status', '/leaderboard', '/leaves'].includes(location.pathname) && "rotate-180")} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="bg-[#FDFDFB]/95 backdrop-blur-xl border border-[#E5DCCB] rounded-3xl p-3 min-w-[280px] shadow-[0_30px_90px_rgba(197,168,128,0.18)] animate-in zoom-in-95 fade-in-0 duration-300">
                    {[
                      { to: '/status', icon: Calendar, label: 'Logs', description: 'Daily Activity Tracking' },
                      { to: '/leaderboard', icon: Trophy, label: 'Ranks', description: 'Team Contribution Metrics' },
                      { to: '/leaves', icon: Calendar, label: 'Leaves', description: 'Time-off Management' },
                    ].map((item) => (
                      <DropdownMenuItem key={item.to} asChild className="rounded-2xl focus:bg-[#FAF8F5] p-3 transition-all duration-500 ease-out group cursor-pointer border border-transparent hover:border-[#E5DCCB]/50 transform-gpu">
                        <NavLink to={item.to} className="flex items-start gap-4 w-full">
                          <div className="bg-[#C5A880]/10 text-[#8C7654] p-2.5 rounded-xl group-hover:bg-gradient-to-br group-hover:from-[#E2D4BF] group-hover:via-[#BFA378] group-hover:to-[#997C53] group-hover:text-white transition-all duration-500 ease-out shadow-sm group-hover:scale-110">
                            <item.icon className="h-4 w-4 drop-shadow-sm" />
                          </div>
                          <div className="flex flex-col gap-1 mt-0.5">
                            <span className="font-sans font-bold text-sm tracking-wide text-[#2C241B] group-hover:text-[#94764D] transition-colors duration-500">{item.label}</span>
                            <span className="text-[10px] font-sans font-medium text-[#A59582]">{item.description}</span>
                          </div>
                        </NavLink>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-full px-5 py-2.5 h-auto flex items-center gap-2 text-[11px] font-sans font-bold uppercase tracking-[0.15em] transition-all duration-500 ease-out hover:scale-105 transform-gpu ${isToolsActive
                        ? 'bg-[#2C241B] text-[#EFEAE2] shadow-lg shadow-[#2C241B]/15 hover:bg-[#38322D]'
                        : 'text-[#5C5040] hover:bg-[#C5A880]/10 hover:text-[#2C241B]'
                        }`}
                    >
                      <Wrench className="h-4 w-4" />
                      Tools
                      <ChevronDown className={cn("h-3 w-3 transition-transform duration-500 ease-out", isToolsActive && "rotate-180")} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="bg-[#FDFDFB]/95 backdrop-blur-xl border border-[#E5DCCB] rounded-3xl p-3 min-w-[280px] shadow-[0_30px_90px_rgba(197,168,128,0.18)] animate-in zoom-in-95 fade-in-0 duration-300">
                    {toolsItems.map((item) => (
                      <DropdownMenuItem key={item.label} asChild className="rounded-2xl focus:bg-[#FAF8F5] p-3 transition-all duration-500 ease-out group cursor-pointer border border-transparent hover:border-[#E5DCCB]/50 transform-gpu">
                        <NavLink to={item.to} className="flex items-start gap-4 w-full">
                          <div className="bg-[#C5A880]/10 text-[#8C7654] p-2.5 rounded-xl group-hover:bg-gradient-to-br group-hover:from-[#E2D4BF] group-hover:via-[#BFA378] group-hover:to-[#997C53] group-hover:text-white transition-all duration-500 ease-out shadow-sm group-hover:scale-110">
                            <item.icon className="h-4 w-4 drop-shadow-sm" />
                          </div>
                          <div className="flex flex-col gap-1 mt-0.5">
                            <span className="font-sans font-bold text-sm tracking-wide text-[#2C241B] group-hover:text-[#94764D] transition-colors duration-500">{item.label}</span>
                            <span className="text-[10px] font-sans font-medium text-[#A59582]">{item.description}</span>
                          </div>
                        </NavLink>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {isSuperUser && (
                  <NavLink
                    to="/users"
                    className="rounded-full px-5 py-2.5 h-auto flex items-center gap-2 text-[11px] font-sans font-bold uppercase tracking-[0.15em] transition-all duration-500 ease-out hover:scale-105 transform-gpu "
                    activeClassName="bg-[#2C241B] text-[#EFEAE2] shadow-lg shadow-[#2C241B]/15 hover:bg-[#38322D] hover:text-[#2C241B]"
                  >
                    <Users className="h-4 w-4" />
                    People
                  </NavLink>
                )}
              </nav>
            </div>

            {/* Profile Section */}
            {user && (
              <div className="flex items-center gap-4">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button className="flex items-center gap-3 bg-transparent hover:bg-[#C5A880]/10 rounded-full px-2 py-1 pr-4 h-auto group transition-all duration-500 ease-out hover:scale-105 active:scale-95 border border-transparent hover:border-[#E5DCCB]/50 transform-gpu">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#E2D4BF] via-[#BFA378] to-[#997C53] flex items-center justify-center p-[2px] shadow-md group-hover:shadow-[#C5A880]/30 transition-shadow duration-500">
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-[#FDFDFB] overflow-hidden border border-white/50">
                          {user.user_metadata?.avatar ? (
                            <img src={user.user_metadata.avatar} alt="Avatar" className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 transform-gpu" />
                          ) : (
                            <User className="h-5 w-5 text-[#8C7654]" />
                          )}
                        </div>
                      </div>
                      <div className="hidden sm:flex flex-col items-start leading-tight">
                        <span className="text-xs font-sans font-bold text-[#2C241B] truncate max-w-[120px] tracking-wide">
                          {user.user_metadata.full_name}
                        </span>
                        <span className="text-[8px] font-sans font-bold text-[#8C7654] uppercase tracking-[0.2em] mt-0.5">
                          {role}
                        </span>
                      </div>
                      <ChevronDown className="h-3 w-3 text-[#A59582] group-hover:text-[#2C241B] transition-colors duration-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#FDFDFB]/95 backdrop-blur-xl border border-[#E5DCCB] rounded-2xl p-2 min-w-[220px] shadow-[0_30px_90px_rgba(197,168,128,0.18)] mt-2 animate-in zoom-in-95 fade-in-0 duration-300">
                    <DropdownMenuItem onClick={() => navigate('/account')} className="rounded-xl focus:bg-[#2C241B] text-[#2C241B]  p-3 cursor-pointer transition-all duration-300 ease-out group">
                      <User className="h-4 w-4 mr-3 text-[#8C7654] group-hover:text-white transition-colors" />
                      <span className="font-sans font-bold tracking-wide group-data-[highlighted]:text-white">Personal Account</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#E5DCCB]/50 my-1" />
                    <DropdownMenuItem onClick={() => signOut()} className="rounded-xl focus:bg-[#2C241B] p-3 cursor-pointer text-[#8C2B2B] font-sans font-bold tracking-wide  transition-all duration-300 ease-out group">
                      <LogOut className="h-4 w-4 mr-3 text-[#8C2B2B] group-hover:text-white " />
                      <span className="font-sans font-bold tracking-wide group-data-[highlighted]:text-white"> Deauthorize Session</span>
                     
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </header>

      {showBanner && <FarewellBanner onClose={() => setShowBanner(false)} />}

      <main className={cn(
        "flex-1 container mb-10 px-4 select-none animate-in fade-in slide-in-from-bottom-4 duration-700 transition-all ease-in-out",
        showBanner ? "mt-48" : "mt-24"
      )}>
        {children}
      </main>

      <QuickLinks />
      {/* <OnlineUsers /> */}
      <NyraFloatingButton />
    </div>
  );
};


export default Layout;