import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Eye,
  Server,
  Scale,
  Database,
  Cpu,
  CheckCircle2,
  ArrowLeft,
  Download,
  Share2,
  Search,
  ChevronRight,
  HelpCircle,
  UserCheck,
  Clock,
  Mail,
  Building2,
  KeyRound,
  FileCheck
} from 'lucide-react';
import { SiChinaeasternairlines } from "react-icons/si";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';


interface Section {
  id: string;
  title: string;
  badge: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export const Privacy = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('introduction');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const lastUpdated = "August 24, 2026";
  const effectiveDate = "January 1, 2026";
  const { toast } = useToast();

  const sections: Section[] = [
    {
      id: 'introduction',
      title: '1. Introduction & Overview',
      badge: 'Core Principles',
      icon: ShieldCheck,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>
            Welcome to <strong className="text-[#2C241B] font-semibold">WASP (The Architect&apos;s Repository)</strong>, an enterprise architectural intelligence suite engineered by Eagle Labs (&ldquo;WASP,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). We are committed to protecting the privacy, integrity, and confidentiality of your intellectual assets, source code repositories, telemetry data, and user information.
          </p>
          <p>
            This Privacy Policy outlines the standards, protocols, and legal frameworks governing how we collect, process, store, retain, and safeguard personal and technical data when you access or interact with our web platform, API endpoints, Chrome browser extensions (Hive), and associated tools.
          </p>
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5DCCB] space-y-2">
            <div className="flex items-center gap-2 text-[#8C7654] font-semibold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-[#8C7654]" />
              Executive Privacy Commitments
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#7A6E5D]">
              <li className="flex items-center gap-1.5">• Zero unauthorized monetization or sale of user data</li>
              <li className="flex items-center gap-1.5">• End-to-end encrypted code snippet workflows</li>
              <li className="flex items-center gap-1.5">• FIDO2 / WebAuthn passwordless biometric authentication support</li>
              <li className="flex items-center gap-1.5">• Full compliance with GDPR, CCPA/CPRA, and global data mandates</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'data-collection',
      title: '2. Information We Collect',
      badge: 'Data Streams',
      icon: Database,
      content: (
        <div className="space-y-5 text-[#5C5040] leading-relaxed">
          <p>
            To deliver high-performance architectural tooling, we collect minimal data strictly required for operational excellence and authorized security validations:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/60 border border-[#E5DCCB] space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-[#2C241B] font-semibold text-sm">
                <UserCheck className="w-4 h-4 text-[#8C7654]" />
                Direct Identification Data
              </div>
              <p className="text-xs text-[#7A6E5D] leading-relaxed">
                Includes your corporate email address, full name, profile avatar, role hierarchy, authorized workspace associations, and encrypted credential hashes or WebAuthn public key descriptors.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/60 border border-[#E5DCCB] space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-[#2C241B] font-semibold text-sm">
                <Cpu className="w-4 h-4 text-[#8C7654]" />
                Repository & Code Artifacts
              </div>
              <p className="text-xs text-[#7A6E5D] leading-relaxed">
                Source snippets, markdown documentation, scripts, schema definitions, CSV visualizer records, and map generation parameters intentionally saved or shared within your organization workspace.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/60 border border-[#E5DCCB] space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-[#2C241B] font-semibold text-sm">
                <Server className="w-4 h-4 text-[#8C7654]" />
                Diagnostic & Telemetry Logs
              </div>
              <p className="text-xs text-[#7A6E5D] leading-relaxed">
                Browser agent fingerprints, IP address, session handshake duration, system errors, export activity logs, and real-time collaborative presence signals.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/60 border border-[#E5DCCB] space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-[#2C241B] font-semibold text-sm">
                <KeyRound className="w-4 h-4 text-[#8C7654]" />
                Security & Verification Tokens
              </div>
              <p className="text-xs text-[#7A6E5D] leading-relaxed">
                Multi-factor session tokens, OAuth grant exchanges, passkey signature proofs, and cryptographic nonces used during continuous mutual authentication.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'data-usage',
      title: '3. How We Process & Utilize Data',
      badge: 'Processing Logic',
      icon: Eye,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>We process collected information based on legitimate technical, operational, and contractual grounds:</p>
          <ul className="space-y-2 text-xs text-[#7A6E5D] list-disc list-inside">
            <li><strong className="text-[#2C241B]">Platform Functionality:</strong> Provisioning code archives, executing syntax verification, indexing Wiki architecture sheets, and synchronizing workspace state.</li>
            <li><strong className="text-[#2C241B]">Continuous Security:</strong> Monitoring anomalous intrusion attempts, protecting session keys, maintaining audit compliance logs, and enforcing role-based permissions (RBAC).</li>
            <li><strong className="text-[#2C241B]">Algorithmic Optimizations:</strong> Improving UI responsiveness, memory-efficient caching with TanStack query layers, and latency reduction across geographically distributed endpoints.</li>
            <li><strong className="text-[#2C241B]">Administrative Communication:</strong> Sending critical security advisories, policy updates, and workspace configuration alerts.</li>
          </ul>
          <div className="p-3 bg-[#FAF8F5] border-l-2 border-[#C5A880] text-xs text-[#8C7654]">
            <strong>Note on Machine Learning:</strong> WASP does NOT feed proprietary customer codebases or sensitive business schemas into generalized public AI training pipelines without explicit organizational consent.
          </div>
        </div>
      ),
    },
    {
      id: 'security-standards',
      title: '4. Encryption & Security Architecture',
      badge: 'Fortified Security',
      icon: Lock,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>
            Security is the bedrock of WASP. Our infrastructure integrates military-grade cryptographic protocols to ensure persistent confidentiality across the entire data lifecycle:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-white/70 border border-[#E5DCCB]">
              <div className="p-2 rounded-lg bg-[#C5A880]/15 text-[#8C7654] font-bold text-xs">TLS 1.3</div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#2C241B]">Encryption in Transit</div>
                <div className="text-[11px] text-[#7A6E5D]">All traffic to and from WASP APIs and clients is enforced with TLS 1.3, Elliptic-Curve Cryptography (ECDSA), and HSTS.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-white/70 border border-[#E5DCCB]">
              <div className="p-2 rounded-lg bg-[#C5A880]/15 text-[#8C7654] font-bold text-xs">AES-256</div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#2C241B]">Encryption at Rest</div>
                <div className="text-[11px] text-[#7A6E5D]">Database entries, code snippets, and encrypted secrets are stored utilizing envelope encryption with hardware-backed KMS key rotation.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-white/70 border border-[#E5DCCB]">
              <div className="p-2 rounded-lg bg-[#C5A880]/15 text-[#8C7654] font-bold text-xs">FIDO2</div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#2C241B]">Passwordless & Passkey Verification</div>
                <div className="text-[11px] text-[#7A6E5D]">Phishing-resistant WebAuthn passkeys allow device-bound hardware authentications without transferring credentials over the wire.</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'subprocessors',
      title: '5. Subprocessors & Third-Party Integrations',
      badge: 'Infrastructure',
      icon: Server,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>
            We engage carefully vetted cloud infrastructure providers and subprocessors that meet strict security and data governance criteria (ISO 27001, SOC 2 Type II):
          </p>
          <div className="overflow-x-auto border border-[#E5DCCB] rounded-xl">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#FAF8F5] text-[#8C7654] uppercase tracking-wider text-[10px] border-b border-[#E5DCCB]">
                <tr>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Data Handled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DCCB]/60 text-[#5C5040]">
                <tr className="hover:bg-white/40">
                  <td className="p-3 font-semibold text-[#2C241B]">Supabase (PostgreSQL)</td>
                  <td className="p-3">Database, Auth & Row Level Security</td>
                  <td className="p-3">US / EU Regions</td>
                  <td className="p-3">Encrypted User records, Snippets, Logs</td>
                </tr>
                <tr className="hover:bg-white/40">
                  <td className="p-3 font-semibold text-[#2C241B]">Vercel Edge Network</td>
                  <td className="p-3">Global Edge CDN & Web Delivery</td>
                  <td className="p-3">Global Edge Nodes</td>
                  <td className="p-3">Cached Static Assets, Edge Handshakes</td>
                </tr>
                <tr className="hover:bg-white/40">
                  <td className="p-3 font-semibold text-[#2C241B]">Eagle Labs Core Infrastructure</td>
                  <td className="p-3">Analytics & Automated Pipeline Engine</td>
                  <td className="p-3">US-East Isolated Cluster</td>
                  <td className="p-3">Aggregated Execution Telemetry</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: 'cookies-tracking',
      title: '6. Cookies, Storage & Local Identifiers',
      badge: 'Device Data',
      icon: Clock,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>
            WASP uses essential session cookies, cryptographic local tokens, and local storage cache strictly for core platform operation:
          </p>
          <ul className="space-y-2 text-xs text-[#7A6E5D] list-disc list-inside">
            <li><strong className="text-[#2C241B]">Essential Session Tokens:</strong> Maintains your authenticated status and prevents unauthorized session hijacking.</li>
            <li><strong className="text-[#2C241B]">User Interface Preferences:</strong> Retains active themes (Luxury Ivory / Obsidian Dark), custom sidebar states, and editor shortcuts.</li>
            <li><strong className="text-[#2C241B]">Offline IndexedDB / Cache:</strong> Temporarily stores draft snippets and recent search queries for instantaneous local retrieval.</li>
          </ul>
          <p className="text-xs text-[#7A6E5D]">
            We do not deploy third-party advertising trackers or invasive behavioral tracking beacons across our application ecosystem.
          </p>
        </div>
      ),
    },
    {
      id: 'user-rights',
      title: '7. Your Privacy Rights & Data Portability',
      badge: 'User Empowerment',
      icon: Scale,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>
            Depending on your jurisdiction (including the Digital Personal Data Protection Act, 2023 (DPDPA) & Information Technology Act in India, GDPR in the European Economic Area, and CCPA/CPRA in California), you possess fundamental statutory rights regarding your personal information:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/60 border border-[#E5DCCB] text-xs">
              <span className="font-bold text-[#2C241B] block mb-1">Right to Access & Inspection</span>
              Request a full machine-readable export of your personal information and code history.
            </div>
            <div className="p-3 rounded-lg bg-white/60 border border-[#E5DCCB] text-xs">
              <span className="font-bold text-[#2C241B] block mb-1">Right to Rectification</span>
              Update or correct inaccurate profile details and administrative permissions directly from My Account.
            </div>
            <div className="p-3 rounded-lg bg-white/60 border border-[#E5DCCB] text-xs">
              <span className="font-bold text-[#2C241B] block mb-1">Right to Erasure (&ldquo;To Be Forgotten&rdquo;)</span>
              Request permanent deauthorization and irreversible deletion of non-essential personal identifiers.
            </div>
            <div className="p-3 rounded-lg bg-white/60 border border-[#E5DCCB] text-xs">
              <span className="font-bold text-[#2C241B] block mb-1">Right to Restrict or Object</span>
              Opt out of non-critical analytics or automated code categorization processing at any time.
            </div>
          </div>
          <p className="text-xs text-[#7A6E5D]">
            To exercise any of these statutory rights or contact our Grievance Officer under India DPDPA / IT rules, please submit a request to <span className="font-semibold text-[#2C241B]">eagle.labs@outlook.com</span>.
          </p>
        </div>
      ),
    },
    {
      id: 'retention',
      title: '8. Data Retention & Decommissioning',
      badge: 'Data Lifecycle',
      icon: FileCheck,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>
            We retain account data and repository metadata only for as long as your organizational account remains active or as required by regulatory audit standards:
          </p>
          <ul className="space-y-1.5 text-xs text-[#7A6E5D] list-disc list-inside">
            <li>Active snippets and documentation are preserved indefinitely until purged by the author or workspace SuperUser.</li>
            <li>Authentication and security logs are rotated and archived for 90 days before automated cryptographic purging.</li>
            <li>Upon complete account deauthorization, all user records are scheduled for hard database deletion within 30 calendar days.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'contact',
      title: '9. Governance Inquiries & Contact',
      badge: 'Get in Touch',
      icon: Building2,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>
            If you have questions, regulatory compliance notices, or security vulnerability disclosures concerning this Privacy Policy, please reach out to our team:
          </p>
          <div className="p-5 rounded-xl bg-gradient-to-br from-[#FAF8F5] via-[#FDFDFB] to-[#F3EEE3] border border-[#E5DCCB] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E2D4BF] via-[#BFA378] to-[#997C53] flex items-center justify-center text-white">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#2C241B]">Eagle Labs Data Protection Office</h4>
                <p className="text-xs text-[#8C7654]">Architectural Intelligence & Privacy Assurance</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-[#5C5040]">
              <div><strong>Email & Grievance:</strong> eagle.labs@outlook.com</div>
              <div><strong>Security Ops:</strong> eagle.labs@outlook.com</div>
              <div><strong>Operational Hub:</strong> Bengaluru (Bangalore), Karnataka, India</div>
              <div><strong>Registered Office:</strong> Global Remote (Everywhere / Distributed)</div>
              <div><strong>Jurisdiction:</strong> Bengaluru, Karnataka, India</div>
              <div><strong>Response SLA:</strong> Within 48 Business Hours</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const filteredSections = sections.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Privacy Policy link copied to clipboard' });

    }
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#FAF9F5] via-[#FDFDFB] to-[#F3EEE3] text-[#2C241B] selection:bg-[#C5A880]/30 relative overflow-x-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#E8DEC9]/30 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#DFD0B8]/20 rounded-full blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23C5A880'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-[#FAF9F5]/90 border-b border-[#E5DCCB] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate(user ? '/' : '/auth')}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E2D4BF] via-[#BFA378] to-[#997C53] flex items-center justify-center shadow-md border border-[#F0E6D2] group-hover:rotate-12 transition-transform duration-500">
              <SiChinaeasternairlines className="text-white text-base" />
            </div>
            <div>
              <span className="text-xl font-cinzel font-semibold tracking-[0.1em] bg-clip-text text-transparent bg-gradient-to-r from-[#2C241B] via-[#94764D] to-[#2C241B]">
                WASP
              </span>
              <span className="hidden sm:inline-block text-[8px] font-sans font-bold text-[#8C7654] uppercase tracking-[0.25em] ml-2">
                Legal & Governance
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/terms"
              className="text-xs font-sans font-semibold text-[#8C7654] hover:text-[#2C241B] px-3 py-1.5 rounded-full hover:bg-[#C5A880]/10 transition-colors"
            >
              Terms of Service
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="rounded-full text-xs text-[#5C5040] hover:bg-[#C5A880]/10 hover:text-[#2C241B] h-8 px-3"
              >
                <Share2 className="w-3.5 h-3.5 mr-1 text-[#8C7654]" />
                Share
              </Button>
            </div>
            <Button
              size="sm"
              onClick={() => navigate(user ? '/' : '/auth')}
              className="rounded-full bg-[#2C241B] hover:bg-[#38322D] text-[#EFEAE2] text-xs font-semibold px-4 h-8 shadow-sm transition-all"
            >
              {user ? (
                <span className="flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 border border-[#C5A880]/30 text-[#8C7654] bg-[#C5A880]/10 rounded-full px-4 py-1 uppercase tracking-[0.25em] text-[9px] font-sans font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Security & Trust Architecture
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl  font-medium  bg-clip-text text-transparent bg-gradient-to-r from-[#2C241B] via-[#94764D] to-[#2C241B] leading-tight">
            Privacy Policy
          </h1>
          <p className="text-md sm:text-md  text-[#5C5040] tracking-wide">
            Our unwavering mandate on data confidentiality, encryption, and intellectual privacy.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs font-sans text-[#8C7654] pt-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Effective: {effectiveDate}
            </span>
            <span className="inline-block w-1 h-1 rounded-full bg-[#C5A880]" />
            <span>Last Revised: {lastUpdated}</span>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          {/* Left Sticky Sidebar: Table of Contents & Search */}
          <aside className="hidden lg:block sticky top-24 space-y-5">
            <div className="bg-[#FAF8F5]/90 backdrop-blur-xl border border-[#E5DCCB] rounded-2xl p-4 shadow-sm space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#8C7654]">
                  Search Sections
                </span>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A59582]" />
                  <Input
                    type="text"
                    placeholder="Search policy..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 pr-3 text-xs bg-white/60 border-[#E5DCCB] rounded-xl placeholder:text-[#A59582]/50 focus-visible:ring-[#C5A880]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#8C7654] block mb-2">
                  Navigation Blueprint
                </span>
                <nav className="space-y-1">
                  {filteredSections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs font-sans transition-all duration-200 ${isActive
                          ? 'bg-[#2C241B] text-[#EFEAE2] font-semibold shadow-sm'
                          : 'text-[#5C5040] hover:bg-[#C5A880]/10 hover:text-[#2C241B]'
                          }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[#C5A880]' : 'text-[#8C7654]'}`} />
                          <span className="truncate">{section.title}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#C5A880] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Quick Legal Switcher */}
              <div className="pt-3 border-t border-[#E5DCCB] space-y-2">
                <div className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#8C7654]">
                  Companion Policy
                </div>
                <Link
                  to="/terms"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/60 hover:bg-white border border-[#E5DCCB] text-xs font-sans text-[#2C241B] transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <Scale className="w-3.5 h-3.5 text-[#8C7654]" />
                    <span>Terms of Service</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#A59582] group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Right Column: Policy Document Articles */}
          <div className="space-y-8">
            {filteredSections.length === 0 ? (
              <Card className="p-8 text-center bg-[#FAF8F5]/80 border-[#E5DCCB] rounded-2xl space-y-3">
                <HelpCircle className="w-8 h-8 text-[#C5A880] mx-auto" />
                <h3 className="text-base font-bold text-[#2C241B]">No matching clauses found</h3>
                <p className="text-xs text-[#7A6E5D]">
                  Try clearing your search query &ldquo;{searchQuery}&rdquo; to view the complete policy document.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="rounded-full text-xs border-[#E5DCCB] hover:bg-[#FAF9F5]"
                >
                  Reset Filter
                </Button>
              </Card>
            ) : (
              filteredSections.map((section) => {
                const Icon = section.icon;
                return (
                  <article
                    key={section.id}
                    id={section.id}
                    className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#FDFDFB]/95 backdrop-blur-xl border border-[#E5DCCB] shadow-[0_10px_30px_rgba(197,168,128,0.08)] transition-all duration-300 hover:shadow-[0_15px_40px_rgba(197,168,128,0.12)] scroll-mt-28"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-[#E5DCCB]/60">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#E2D4BF] via-[#BFA378] to-[#997C53] text-white shadow-sm">
                          <Icon className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-heading font-semibold text-[#2C241B] tracking-tight">
                          {section.title}
                        </h2>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-[#C5A880]/10 border-[#C5A880]/30 text-[#8C7654] text-[10px] font-sans uppercase tracking-wider py-1 px-3"
                      >
                        {section.badge}
                      </Badge>
                    </div>

                    <div className="text-sm font-sans text-[#5C5040]">
                      {section.content}
                    </div>
                  </article>
                );
              })
            )}

            {/* Bottom Regulatory Seal & Cross-link */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FAF8F5] via-[#FDFDFB] to-[#F3EEE3] border border-[#E5DCCB] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-[#2C241B]">
                  Looking for our Terms of Service?
                </h3>
                <p className="text-xs text-[#7A6E5D] max-w-md">
                  Read about acceptable use, intellectual property retention, SLA warranties, and enterprise licensing.
                </p>
              </div>
              <Button
                onClick={() => navigate('/terms')}
                className="rounded-full bg-[#2C241B] hover:bg-[#38322D] text-[#EFEAE2] text-xs font-semibold px-6 py-2.5 shadow-md transition-all hover:scale-105"
              >
                View Terms of Service <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-[#E5DCCB] bg-[#FAF8F5] py-10 relative z-10 text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E2D4BF] via-[#BFA378] to-[#997C53] flex items-center justify-center text-white text-xs">
              <SiChinaeasternairlines />
            </div>
            <span className="text-sm font-semibold tracking-[0.1em] text-[#2C241B]">
              WASP ARCHITECTURAL INTELLIGENCE
            </span>
          </div>
          <p className="text-[9px] font-sans font-bold uppercase tracking-[0.3em] text-[#A59582]">
            Proprietary Enterprise Infrastructure • Powered by Eagle Labs
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-[#8C7654] font-medium pt-2">
            <Link to="/privacy" className="hover:text-[#2C241B] underline underline-offset-4">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#2C241B] underline underline-offset-4">Terms of Service</Link>
            <Link to="/auth" className="hover:text-[#2C241B]">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
