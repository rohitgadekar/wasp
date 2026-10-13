import { Button } from "@/components/ui/button";
import {
  Download,
  ExternalLink,
  Puzzle,
  Settings,
  FolderArchive,
  CheckCircle2,
  Hexagon,
  Sparkles,
  Shield,
  Zap,
  Lock,
  ArrowRight,
  Play,
  Clock,
  Target,
  TrendingUp,
  Workflow,
  Bug,
  Layers,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTitle } from "@/hooks/use-title";
import { useHiveAccess } from "@/hooks/useHiveAccess";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { SiChinaeasternairlines } from "react-icons/si";

const Hive = () => {
  useTitle("Hive Extension");

  const { hasAccess, loading } = useHiveAccess();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Extension download URL
  const downloadUrl =
    "https://nslyikktilelnqigidvk.supabase.co/storage/v1/object/public/extension/hive%20v1.4.0.zip";

  const steps = [
    {
      title: "Download Extension",
      description:
        "Click the download button to get the Hive ZIP archive.",
      icon: FolderArchive,
    },
    {
      title: "Extract the File",
      description:
        "Extract the contents of the ZIP file to a secure directory on your local computer.",
      icon: FolderArchive,
    },
    {
      title: "Open Extensions",
      description:
        "Launch Google Chrome and navigate to chrome://extensions in the address bar.",
      icon: ExternalLink,
    },
    {
      title: "Developer Mode",
      description:
        "Enable the 'Developer mode' toggle in the top right corner of the extension interface.",
      icon: Settings,
    },
    {
      title: "Load Unpacked",
      description:
        "Click 'Load unpacked' and select the directory where you extracted the Hive files.",
      icon: Puzzle,
    },
    {
      title: "Ready to Sync",
      description:
        "Hive is installed! Pin it to your browser toolbar for quick navigation and mapping.",
      icon: CheckCircle2,
    },
  ];

  const problems = [
    {
      icon: Clock,
      title: "Manual Tracker Navigation",
      description:
        "Every transformation test requires manually copying execution IDs and navigating to the Transaction Tracker repetitive and time consuming.",
      stat: "One click",
      statLabel: "instead of five",
    },
    {
      icon: Bug,
      title: "Scattered Task Management",
      description:
        "Jira tickets live separately from your Wasp workspace. Logging tasks requires context switching between multiple tools.",
      stat: "Direct",
      statLabel: "Jira → Wasp sync",
    },
    {
      icon: Layers,
      title: "Legacy Map Limitations",
      description:
        "Legacy Map Viewer and Creator lack modern tooling. No quick access to xrefs, helpers, or formatting utilities.",
      stat: "Built-in",
      statLabel: "toolbar & tools",
    },
  ];

  const features = [
    {
      icon: Zap,
      title: "Quick Tracker Access",
      desc: "Extract execution IDs from Transformation Tester and open Transaction Tracker with a single click no manual copying.",
      highlight: "One Click",
    },
    {
      icon: Sparkles,
      title: "Jira Task Logging",
      desc: "Log Jira tasks directly to Wasp without leaving your ticket page. Seamless integration for better task tracking.",
      highlight: "Direct Sync",
    },
    {
      icon: Shield,
      title: "Access Control",
      desc: "Owner-gated permissions via Wasp User Management. Your team's access is always under your control.",
      highlight: "Secure",
    },
  ];

  const supportedPages = [
    {
      icon: "🧪",
      title: "Transformation Tester",
      description: "Extracts execution ID → opens Transaction Tracker",
    },
    {
      icon: "🗺️",
      title: "Legacy Map Viewer / Creator",
      description: "Toolbar, floating actions, format button",
    },
    {
      icon: "🎫",
      title: "Jira Tickets",
      description: "Log tasks directly to Wasp from Jira",
    },
  ];

  const extensionFeatures = [
    {
      icon: "⚡",
      title: "Quick Tracker",
      desc: "One click to Transaction Tracker",
    },
    {
      icon: "📋",
      title: "Task Logging",
      desc: "Log Jira tasks straight to Wasp",
    },
    {
      icon: "🛠️",
      title: "Map Toolbar",
      desc: "Xrefs, helpers & format tools",
    },
    {
      icon: "🔐",
      title: "Access Gated",
      desc: "Owner-controlled via Wasp",
    },
  ];

  const testimonials = [
    {
      quote:
        "The one-click Transaction Tracker saves me dozens of clicks every day. It's the small things that add up.",
      author: "EDI Developer",
      company: "Supply Chain Solutions",
    },
    {
      quote:
        "Logging Jira tasks directly to Wasp without leaving the ticket page? Game changer for my workflow.",
      author: "Integration Specialist",
      company: "Enterprise Tech Team",
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FDFCFA]">
        <div className="relative">
          <div className="absolute inset-0 animate-ping opacity-20">
            <Hexagon className="w-16 h-16 text-[#C5A880]" />
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-[#C5A880] relative z-10" />
        </div>
      </div>
    );
  }

  // Access denied state
  if (!hasAccess) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center overflow-hidden bg-[#FDFCFA]">
        {/* Ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C5A880]/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] animate-pulse pointer-events-none"
          style={{ animationDelay: "1.5s" }}
        />

        <div className="relative z-10 max-w-lg w-full flex flex-col items-center">
          {/* Icon */}
          <div className="relative mb-10">
            <div
              className="w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #2C241B 0%, #4A3C2E 100%)",
                border: "1px solid rgba(197,168,128,0.2)",
              }}
            >
              <Hexagon className="h-12 w-12" style={{ color: "#C5A880" }} />
            </div>
            {/* Lock badge */}
            <div
              className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #C5A880, #A8896A)" }}
            >
              <Lock className="w-4 h-4" style={{ color: "#2C241B" }} />
            </div>
          </div>

          {/* Heading */}
          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight"
            style={{ color: "#2C241B" }}
          >
            Hey, {user?.user_metadata?.full_name?.split(" ")[0] || "there"}
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #C5A880, #A8896A)" }}
            >
              Hive isn't yours yet.
            </span>
          </h1>

          <p
            className="text-base font-medium leading-relaxed mb-10 max-w-sm"
            style={{ color: "#A59582" }}
          >
            The Hive extension is access-controlled. Ask your owner to flip the switch
            for your account in User Management.
          </p>

          {/* CTA */}
          <Button
            onClick={() => navigate("/")}
            className="rounded-full px-10 h-14 text-sm font-bold uppercase tracking-widest border-0 shadow-xl transition-all "
            style={{
              background: "linear-gradient(135deg, #C5A880, #A8896A)",
              color: "#2C241B",
            }}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#FDFCFA] overflow-hidden">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] opacity-30">
          <div className="absolute inset-0 bg-gradient-to-bl from-[#C5A880]/20 via-transparent to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] opacity-20">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-200/30 via-transparent to-transparent" />
        </div>
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #2C241B 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-6">
          <div className="max-w-6xl mx-auto">


            {/* Hero Content */}
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              {/* Icon */}
              <div
                className={`mb-8 transition-all duration-1000 delay-100 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
                  }`}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-[#C5A880]/20 rounded-3xl blur-2xl scale-150" />
                  <div
                    className="relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl"
                    style={{
                      background: "linear-gradient(135deg, #C5A880, #A8896A)",
                    }}
                  >
                    <Hexagon
                      className="h-10 w-10 fill-white/20"
                      style={{ color: "#2C241B" }}
                    />
                  </div>
                </div>
              </div>

              {/* Headline */}
              <h1
                className={`text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1] transition-all duration-1000 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                style={{ color: "#2C241B" }}
              >
                Browser Extension
                <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: "linear-gradient(135deg, #C5A880, #8C7654)",
                  }}
                >
                  for SPS Commerce
                </span>
              </h1>

              {/* Subheadline */}
              <p
                className={`text-lg md:text-xl font-medium leading-relaxed mb-10 max-w-2xl transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                style={{ color: "#8C7654" }}
              >
                Quick Transaction Tracker access, Jira task logging, and map tooling
                all integrated directly into your browser workflow.
              </p>

              {/* CTA Buttons */}
              <div
                className={`flex flex-col sm:flex-row gap-4 transition-all duration-1000 delay-400 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
              >
                <Button
                  size="lg"
                  className="rounded-full px-10 py-7 text-sm font-bold tracking-wider uppercase border-0 shadow-xl transition-all hover:scale-105 hover:shadow-2xl active:scale-95 group"
                  style={{
                    background: "linear-gradient(135deg, #2C241B, #4A3C2E)",
                    color: "#C5A880",
                  }}
                  asChild
                >
                  <a href={downloadUrl} download>
                    <Download className="mr-3 h-5 w-5 group-hover:animate-bounce" />
                    Download Hive
                    <ArrowRight className="ml-3 h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 py-7 text-sm font-bold tracking-wider uppercase border-2 shadow-lg transition-all hover:scale-105 active:scale-95"
                  style={{
                    borderColor: "#E3DAC9",
                    color: "#2C241B",
                    background: "transparent",
                  }}
                  onClick={() => {
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <Play className="mr-3 h-4 w-4" />
                  See How It Works
                </Button>
              </div>

              {/* Trust indicators */}
              <div
                className={`mt-12 flex flex-wrap justify-center gap-8 transition-all duration-1000 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#C5A880]" />
                  <span className="text-sm font-medium" style={{ color: "#A59582" }}>
                    Owner-Gated Access
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-[#C5A880]" />
                  <span className="text-sm font-medium" style={{ color: "#A59582" }}>
                    Auto Session Sync
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#C5A880]" />
                  <span className="text-sm font-medium" style={{ color: "#A59582" }}>
                    One-Click Actions
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problems Section */}
        <section className="relative py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge
                className="bg-red-50 text-red-700 border border-red-200 rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest mb-6"
              >
                The Problem
              </Badge>
              <h2
                className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
                style={{ color: "#2C241B" }}
              >
                Legacy Mapping Costs You
                <span className="text-[#C5A880]"> Time & Accuracy</span>
              </h2>
              <p
                className="text-base font-medium max-w-2xl mx-auto"
                style={{ color: "#A59582" }}
              >
                Every day, teams lose hours to outdated interfaces and manual processes.
                Hive was built to eliminate these pain points.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {problems.map((problem, index) => (
                <Card
                  key={index}
                  className="relative border-0 overflow-hidden shadow-lg group transition-all duration-500 hover:-translate-y-2 hover:shadow-xl flex flex-col"
                  style={{
                    background: "linear-gradient(180deg, #FFFDF9 0%, #FDF8F0 100%)",
                    boxShadow: "0 4px 24px rgba(44,36,27,0.06)",
                  }}
                >
                  {/* Top accent line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5 opacity-50"
                    style={{ background: "linear-gradient(to right, #E3DAC9, #C5A880, #E3DAC9)" }}
                  />

                  <div className="p-8 flex flex-col flex-1">
                    {/* Icon */}
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-md"
                      style={{
                        background: "linear-gradient(135deg, rgba(197,168,128,0.15), rgba(197,168,128,0.05))",
                        border: "1px solid rgba(197,168,128,0.2)",
                      }}
                    >
                      <problem.icon className="w-7 h-7 text-[#8C7654]" />
                    </div>

                    {/* Content */}
                    <h3
                      className="text-lg font-bold mb-3 leading-snug"
                      style={{ color: "#2C241B" }}
                    >
                      {problem.title}
                    </h3>
                    <p
                      className="text-sm font-medium leading-relaxed flex-1"
                      style={{ color: "#A59582" }}
                    >
                      {problem.description}
                    </p>

                    {/* Stat - anchored to bottom */}
                    <div className="flex items-end gap-2 mt-6">
                      <span
                        className="text-3xl font-bold"
                        style={{ color: "#C5A880" }}
                      >
                        {problem.stat}
                      </span>
                      <span
                        className="text-xs font-medium pb-1 uppercase tracking-wide"
                        style={{ color: "#A59582" }}
                      >
                        {problem.statLabel}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Ecosystem Section */}
        <section className="relative py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2
                className="text-2xl md:text-3xl font-bold tracking-tight mb-4"
                style={{ color: "#2C241B" }}
              >
                The Wasp
                <span className="text-[#C5A880]"> ↔ Hive Ecosystem</span>
              </h2>
              <p
                className="text-base font-medium max-w-xl mx-auto"
                style={{ color: "#A59582" }}
              >
                Sign in once,
                and the extension handles the rest.
              </p>
            </div>

            <div
              className="rounded-2xl border p-8 md:p-10"
              style={{
                background: "linear-gradient(135deg, #2C241B 0%, #3D3127 100%)",
                borderColor: "rgba(197,168,128,0.2)",
              }}
            >
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
                {/* Wasp */}
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                  >
                    {/* <span className="text-2xl">🐝</span> */}
                    <SiChinaeasternairlines className="h-6 w-6 text-white drop-shadow-md relative z-10" />
                  </div>
                  <div
                    className="text-lg font-bold"
                    style={{ color: "rgba(253,252,250,0.95)" }}
                  >
                    Wasp
                  </div>
                  <div
                    className="text-xs font-medium uppercase tracking-wider mt-1"
                    style={{ color: "rgba(197,168,128,0.6)" }}
                  >
                    Main Platform
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-12 h-px"
                    style={{ background: "rgba(197,168,128,0.3)" }}
                  />
                  <ArrowRight className="w-5 h-5 text-[#C5A880]" />
                  <div
                    className="w-12 h-px"
                    style={{ background: "rgba(197,168,128,0.3)" }}
                  />
                </div>

                {/* Hive */}
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                  >
                    <Hexagon className="w-8 h-8 text-white" />
                  </div>
                  <div
                    className="text-lg font-bold"
                    style={{ color: "rgba(253,252,250,0.95)" }}
                  >
                    Hive
                  </div>
                  <div
                    className="text-xs font-medium uppercase tracking-wider mt-1"
                    style={{ color: "rgba(197,168,128,0.6)" }}
                  >
                    Browser Extension
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-12 h-px"
                    style={{ background: "rgba(197,168,128,0.3)" }}
                  />
                  <ArrowRight className="w-5 h-5 text-[#C5A880]" />
                  <div
                    className="w-12 h-px"
                    style={{ background: "rgba(197,168,128,0.3)" }}
                  />
                </div>

                {/* SPS Commerce */}
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: "linear-gradient(135deg, #60a5fa, #3b82f6)" }}
                  >
                    <Workflow className="w-8 h-8 text-white" />
                  </div>
                  <div
                    className="text-lg font-bold"
                    style={{ color: "rgba(253,252,250,0.95)" }}
                  >
                    SPS Commerce
                  </div>
                  <div
                    className="text-xs font-medium uppercase tracking-wider mt-1"
                    style={{ color: "rgba(197,168,128,0.6)" }}
                  >
                    Integration Target
                  </div>
                </div>
              </div>

              <div
                className="mt-8 pt-8 text-center"
                style={{ borderTop: "1px solid rgba(197,168,128,0.15)" }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: "rgba(197,168,128,0.7)" }}
                >
                  Visit <span className="font-semibold text-[#C5A880]">wasp.rohitgadekar.dev</span> and log in.
                  no manual configuration needed.
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* Installation Guide */}
        <section className="relative py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge
                className="bg-[#C5A880]/10 text-[#8C7654] border border-[#E5DCCB] rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest mb-6"
              >
                Quick Setup
              </Badge>
              <h2
                className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
                style={{ color: "#2C241B" }}
              >
                Deploy in
                <span className="text-[#C5A880]"> 60 Seconds</span>
              </h2>
              <p
                className="text-base font-medium max-w-2xl mx-auto"
                style={{ color: "#A59582" }}
              >
                No complex configuration. No API keys to manage. Just download, install,
                and start automating.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="relative p-6 rounded-xl border group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    background: "#FFFDF9",
                    borderColor: "#E3DAC9",
                    boxShadow: "0 2px 12px rgba(44,36,27,0.04)",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg, #C5A880, #A8896A)",
                        color: "#2C241B",
                      }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3
                        className="text-base font-bold mb-2"
                        style={{ color: "#2C241B" }}
                      >
                        {step.title}
                      </h3>
                      <p
                        className="text-sm font-medium leading-relaxed"
                        style={{ color: "#A59582" }}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Footer spacing */}
        <div className="h-12" />
      </div>
    </div>
  );
};

export default Hive;
