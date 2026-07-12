import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Puzzle, Settings, FolderArchive, CheckCircle2, Hexagon, Sparkles, Shield, Zap, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTitle } from "@/hooks/use-title";
import { useHiveAccess } from "@/hooks/useHiveAccess";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hive = () => {
  useTitle("Hive Extension");

  const { hasAccess, loading } = useHiveAccess();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Extension download URL
  const downloadUrl = "https://nslyikktilelnqigidvk.supabase.co/storage/v1/object/public/extension/hive.zip";

  const steps = [
    {
      title: "Download Extension",
      description: "Click the download button to get the Hive ZIP archive.",
      icon: FolderArchive,
    },
    {
      title: "Extract the File",
      description: "Extract the contents of the ZIP file to a secure directory on your local computer.",
      icon: FolderArchive,
    },
    {
      title: "Open Extensions",
      description: "Launch Google Chrome and navigate to chrome://extensions in the address bar.",
      icon: ExternalLink,
    },
    {
      title: "Developer Mode",
      description: "Enable the 'Developer mode' toggle in the top right corner of the extension interface.",
      icon: Settings,
    },
    {
      title: "Load Unpacked",
      description: "Click 'Load unpacked' and select the directory where you extracted the Hive files.",
      icon: Puzzle,
    },
    {
      title: "Ready to Sync",
      description: "Hive is installed! Pin it to your browser toolbar for quick navigation and mapping.",
      icon: CheckCircle2,
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Access denied state
  if (!hasAccess) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />

        <div className="relative z-10 max-w-lg w-full flex flex-col items-center">
          {/* Icon */}
          <div className="relative mb-10">
            <div className="w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #2C241B 0%, #4A3C2E 100%)', border: '1px solid rgba(197,168,128,0.2)' }}>
              <Hexagon className="h-12 w-12" style={{ color: '#C5A880' }} />
            </div>
            {/* Lock badge */}
            <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #C5A880, #A8896A)' }}>
              <Lock className="w-4 h-4" style={{ color: '#2C241B' }} />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight" style={{ color: '#2C241B' }}>
            Hey, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}
            <br />
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #C5A880, #A8896A)' }}>
              Hive isn't yours yet.
            </span>
          </h1>

          <p className="text-base font-medium leading-relaxed mb-10 max-w-sm" style={{ color: '#A59582' }}>
            The Hive extension is access-controlled. Ask your owner to flip the switch for your account in User Management.
          </p>

          {/* CTA */}
          <Button
            onClick={() => navigate('/')}
            size="lg"
            className="rounded-full px-10 h-13 text-sm font-bold uppercase tracking-widest border-0 shadow-xl transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #C5A880, #A8896A)', color: '#2C241B' }}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="relative space-y-16 mx-auto p-6 md:p-10 max-w-5xl pb-20 z-10">

        {/* Page Header */}
        <div className="flex justify-center">
          <Badge className="bg-[#C5A880]/10 text-[#8C7654] border border-[#E5DCCB] rounded-full px-6 py-1.5 uppercase tracking-[0.3em] text-[10px] font-sans font-bold shadow-sm">
            Browser Integration
          </Badge>
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #C5A880, #A8896A)' }}>
            <Hexagon className="h-8 w-8 fill-white/20" style={{ color: '#2C241B' }} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight leading-tight" style={{ color: '#2C241B' }}>
            Welcome to the{" "}
            <span style={{ color: '#C5A880' }}>Hive</span>
          </h1>
          <p className="text-base font-medium leading-relaxed" style={{ color: '#A59582' }}>
            Unleash the full potential of your workflow. The Hive extension injects helper controls,
            streamlines legacy SPS Commerce mapping, and synchronizes data directly into your workspace.
          </p>
          <Button size="lg" className="rounded-full px-10 py-6 text-sm font-bold tracking-widest uppercase border-0 shadow-lg transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #C5A880, #A8896A)', color: '#2C241B' }} asChild>
            <a href={downloadUrl} download>
              <Download className="mr-3 h-4 w-4" />
              Download Hive Extension
            </a>
          </Button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Zap,      title: 'Direct Injection',    desc: 'Enables inline interactive components directly inside legacy map and creator pages, removing click delays.' },
            { icon: Sparkles, title: 'Quick Sync',          desc: 'Allows mapping payloads to be automatically synced with your local Code Sanctuary workspace instantly.' },
            { icon: Shield,   title: 'Secure Propagation', desc: 'Auth tokens are kept encrypted in local memory and are never transmitted beyond your official instances.' },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-0 overflow-hidden shadow-xl group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl" style={{ background: '#FDFDFB', boxShadow: '0 4px 20px rgba(44,36,27,0.08), 0 1px 0 #E3DAC9' }}>
              <div className="h-1 w-full" style={{ background: 'linear-gradient(to right, #C5A880, #A8896A, #C5A880)' }} />
              <div className="p-6 space-y-4">
                
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold" style={{ color: '#2C241B' }}>{title}</h3>
                  <p className="text-sm font-medium leading-relaxed" style={{ color: '#A59582' }}>{desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Deployment Guide */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #E3DAC9)' }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: '#A59582' }}>Deployment Guide</span>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #E3DAC9)' }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {steps.map((step, index) => (
              <div key={index} className="relative p-5 rounded-xl border group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg" style={{ background: '#FDFDFB', borderColor: '#E3DAC9', boxShadow: '0 2px 12px rgba(44,36,27,0.05)' }}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'rgba(197,168,128,0.12)', color: '#8C7654', border: '1px solid #E3DAC9' }}>
                      {index + 1}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold" style={{ color: '#2C241B' }}>{step.title}</h3>
                    <p className="text-xs font-medium leading-relaxed" style={{ color: '#A59582' }}>{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sync Panel */}
        <div className="rounded-xl border p-8 relative overflow-hidden" style={{ background: 'rgba(197,168,128,0.04)', borderColor: '#E3DAC9' }}>
          <div className="flex flex-col lg:flex-row items-center gap-6 relative z-10">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm shrink-0" style={{ background: 'linear-gradient(135deg, #C5A880, #A8896A)' }}>
              <Hexagon className="h-7 w-7 fill-white/20" style={{ color: '#2C241B' }} />
            </div>
            <div className="space-y-2 flex-1 text-center lg:text-left">
              <h3 className="text-lg font-bold" style={{ color: '#2C241B' }}>Access &amp; Token Handshake</h3>
              <p className="text-sm font-medium leading-relaxed" style={{ color: '#A59582' }}>
                Initialize the browser authentication handshake by opening the extension while on the{" "}
                <span className="font-semibold" style={{ color: '#8C7654' }}>Transformation Tester</span> page.
                Once your token is automatically captured and synced, the Hive extension is fully operational!
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full -mr-20 -mt-20" style={{ background: 'radial-gradient(circle, rgba(197,168,128,0.15), transparent 70%)' }} />
        </div>

      </div>
    </div>
  );
};

export default Hive;
