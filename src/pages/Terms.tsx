import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Scale,
  FileCheck2,
  ShieldAlert,
  Lock,
  Terminal,
  Code2,
  AlertTriangle,
  Ban,
  Gavel,
  RefreshCw,
  ArrowLeft,
  Download,
  Share2,
  Search,
  ChevronRight,
  HelpCircle,
  Clock,
  Mail,
  Building2,
  CheckCircle2,
  FileCode,
  Flame
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

export const Terms = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('acceptance');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const lastUpdated = "August 24, 2026";
  const effectiveDate = "January 1, 2026";
  const { toast } = useToast();

  const sections: Section[] = [
    {
      id: 'acceptance',
      title: '1. Acceptance & Agreement to Terms',
      badge: 'Binding Agreement',
      icon: Scale,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>
            These Terms of Service (&ldquo;Terms,&rdquo; &ldquo;Agreement&rdquo;) constitute a legally binding contract between you (either individually or on behalf of the commercial entity you represent) and <strong className="text-[#2C241B] font-semibold">Eagle Labs Technologies</strong> (&ldquo;Eagle Labs,&rdquo; &ldquo;WASP,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;).
          </p>
          <p>
            By accessing, creating an account, authenticating via passkeys, deploying scripts, or otherwise interacting with the <strong className="text-[#2C241B]">WASP Architectural Intelligence Suite</strong> (&ldquo;Platform&rdquo;), you expressly acknowledge that you have read, understood, and agree to be strictly bound by all terms, conditions, and governance rules herein.
          </p>
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5DCCB] space-y-2">
            <div className="flex items-center gap-2 text-[#8C7654] font-semibold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-[#8C7654]" />
              Essential Eligibility Mandate
            </div>
            <p className="text-xs text-[#7A6E5D]">
              You affirm that you are of legal contracting age (at least 18 years old or the age of legal majority in your territory) and possess the corporate authority to bind your organization to these Terms. If you do not agree, you must immediately terminate platform access and session handshakes.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'service-scope',
      title: '2. Platform Architecture & Service Scope',
      badge: 'Operational Scope',
      icon: Terminal,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>
            WASP is an enterprise-grade architectural repository and intelligence environment designed for high-performance engineering teams. The scope of Platform capabilities encompasses:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white/60 border border-[#E5DCCB] space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-[#2C241B]">
                <Code2 className="w-4 h-4 text-[#8C7654]" />
                Code Asset Repository
              </div>
              <p className="text-[11px] text-[#7A6E5D]">
                Multi-language snippet storage, syntax indexing, tagging hierarchies, and cryptographic revision logging.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/60 border border-[#E5DCCB] space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-[#2C241B]">
                <FileCode className="w-4 h-4 text-[#8C7654]" />
                Architectural Wiki & Maps
              </div>
              <p className="text-[11px] text-[#7A6E5D]">
                Collaborative documentation sheets, map name generators, and EDI document discovery matrices.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/60 border border-[#E5DCCB] space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-[#2C241B]">
                <Terminal className="w-4 h-4 text-[#8C7654]" />
                Script Utilities & Automation
              </div>
              <p className="text-[11px] text-[#7A6E5D]">
                Execution templates, CLI script management, and data visualizer modules.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/60 border border-[#E5DCCB] space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-[#2C241B]">
                <ShieldAlert className="w-4 h-4 text-[#8C7654]" />
                Governance & Team Telemetry
              </div>
              <p className="text-[11px] text-[#7A6E5D]">
                Daily status workflows, real-time presence indicators, leaderboard rankings, and role-based access controls.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'account-security',
      title: '3. Authentication, Passkeys & Account Integrity',
      badge: 'Account Security',
      icon: Lock,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>
            Access to WASP requires authenticated credentials or WebAuthn biometric passkeys managed under organizational security policies:
          </p>
          <ul className="space-y-2 text-xs text-[#7A6E5D] list-disc list-inside">
            <li><strong className="text-[#2C241B]">Credential Protection:</strong> You are solely responsible for preserving the secrecy of your passwords, security ciphers, and hardware authenticator tokens.</li>
            <li><strong className="text-[#2C241B]">Account Sharing Prohibited:</strong> Individual user seats are non-transferable. You may not share session tokens or allow unverified third parties to impersonate your identity.</li>
            <li><strong className="text-[#2C241B]">Security Breach Notification:</strong> You must promptly notify <span className="font-semibold text-[#2C241B]">eagle.labs@outlook.com</span> within 12 hours of becoming aware of any unauthorized access or compromise of your access credentials.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'intellectual-property',
      title: '4. Intellectual Property & Code Ownership',
      badge: 'IP Protection',
      icon: FileCheck2,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>
            We maintain strict boundaries between your proprietary software assets and the platform technology that powers WASP:
          </p>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-white/70 border border-[#E5DCCB] space-y-1.5">
              <h4 className="text-xs font-bold text-[#2C241B] uppercase tracking-wide">
                A. Customer Content & Source Code (Your Property)
              </h4>
              <p className="text-xs text-[#7A6E5D] leading-relaxed">
                You and your licensors retain 100% full, exclusive ownership, title, copyright, and patent rights in and to all code snippets, scripts, configurations, schemas, architectural blueprints, and documents authored or deposited into WASP. WASP acquires no ownership rights over your intellectual code assets.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/70 border border-[#E5DCCB] space-y-1.5">
              <h4 className="text-xs font-bold text-[#2C241B] uppercase tracking-wide">
                B. WASP Platform Intellectual Property (Eagle Labs Property)
              </h4>
              <p className="text-xs text-[#7A6E5D] leading-relaxed">
                The WASP name, logo, medallion crests, user interfaces, design tokens, styling architecture, API schemas, underlying microservices, algorithms, and documentation are the exclusive intellectual property of Eagle Labs Technologies and are protected by international trademark, trade dress, and patent laws.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'acceptable-use',
      title: '5. Acceptable Use & Prohibited Activities',
      badge: 'Rules of Conduct',
      icon: Ban,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>
            To preserve the security, integrity, and operational balance of the WASP ecosystem, you agree NOT to engage in the following prohibited behaviors:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#7A6E5D]">
            <div className="p-3 rounded-lg bg-red-50/40 border border-red-200/50 space-y-1">
              <span className="font-bold text-[#8C2B2B] block">No Malicious Injection</span>
              Uploading or executing malware, ransomware, weaponized exploits, or unauthorized keyloggers.
            </div>
            <div className="p-3 rounded-lg bg-red-50/40 border border-red-200/50 space-y-1">
              <span className="font-bold text-[#8C2B2B] block">No Reverse Engineering</span>
              Decompiling, disassembling, or extracting proprietary source binaries of the WASP intelligence platform.
            </div>
            <div className="p-3 rounded-lg bg-red-50/40 border border-red-200/50 space-y-1">
              <span className="font-bold text-[#8C2B2B] block">No Rate Limit Bypassing</span>
              Deploying abusive automated scrapers, denial-of-service stress tests, or unauthorized load bombardments.
            </div>
            <div className="p-3 rounded-lg bg-red-50/40 border border-red-200/50 space-y-1">
              <span className="font-bold text-[#8C2B2B] block">No Privilege Escalation</span>
              Attempting to circumvent SuperUser controls, row level security policies, or access other organizations&apos; data partitions.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'availability-sla',
      title: '6. Service Availability & Scheduled Maintenance',
      badge: 'SLA Standards',
      icon: RefreshCw,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>
            While we target a 99.9% annualized operational availability for enterprise deployments, WASP does not guarantee uninterrupted or zero-latency service. We reserve the right to perform scheduled security maintenance, database optimizations, and system migrations with reasonable advance notice when feasible.
          </p>
          <p className="text-xs text-[#7A6E5D]">
            Emergency security patches or mitigation against zero-day threats may be applied dynamically without advance notice to ensure workspace safety.
          </p>
        </div>
      ),
    },
    {
      id: 'disclaimer-warranties',
      title: '7. Warranty Disclaimer',
      badge: 'Legal Disclaimer',
      icon: AlertTriangle,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/60 text-xs text-[#7A6E5D] space-y-2">
            <p className="uppercase tracking-wider font-bold text-[#8C7654]">
              &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; PROVISION
            </p>
            <p>
              EXCEPT AS EXPRESSLY SET FORTH IN A DULY SIGNED ENTERPRISE SERVICE LEVEL AGREEMENT, THE WASP PLATFORM, ALL ACCOMPANYING SCRIPTS, CODE LIBRARIES, TOOLS, WIKIS, AND APIs ARE PROVIDED STRICTLY ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. EAGLE LABS SPECIFICALLY DISCLAIMS ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR ARCHITECTURAL PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'liability-limitation',
      title: '8. Limitation of Liability',
      badge: 'Liability Cap',
      icon: ShieldAlert,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p className="text-xs text-[#7A6E5D] leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL EAGLE LABS, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEORS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, REPOSITORY DATA LOSS, WORK STOPPAGE, OR SYSTEM OUTAGES ARISING OUT OF OR IN CONNECTION WITH THE USE OF OR INABILITY TO USE THE PLATFORM.
          </p>
          <div className="p-3 bg-white/70 border border-[#E5DCCB] rounded-xl text-xs text-[#5C5040]">
            <strong>Aggregate Liability Ceiling:</strong> Under no circumstances will our aggregate liability arising out of or related to these Terms exceed the amount paid by you or your organization to WASP in the twelve (12) months preceding the incident giving rise to liability.
          </div>
        </div>
      ),
    },
    {
      id: 'indemnification',
      title: '9. Mutual Indemnification',
      badge: 'Indemnity',
      icon: Flame,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>
            You agree to defend, indemnify, and hold harmless Eagle Labs, its directors, employees, and agents from and against any third-party claims, damages, liabilities, losses, and reasonable legal expenses arising out of:
          </p>
          <ul className="space-y-1.5 text-xs text-[#7A6E5D] list-disc list-inside">
            <li>Any code, script, or content deposited or deployed by your account that infringes third-party intellectual property.</li>
            <li>Your violation of these Terms of Service or applicable data protection regulations.</li>
            <li>Willful misconduct or unauthorized privilege abuse by authorized account users.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'termination',
      title: '10. Session Deauthorization & Termination',
      badge: 'Termination',
      icon: Ban,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>
            These Terms remain effective until terminated by either party. You may deauthorize your session or request workspace deletion at any time from your account settings.
          </p>
          <p className="text-xs text-[#7A6E5D]">
            We reserve the right to suspend or terminate account credentials immediately and without liability if we detect material breach of these Terms, suspicious cryptographic compromise, or persistent unauthorized intrusion activity.
          </p>
        </div>
      ),
    },
    {
      id: 'governing-law',
      title: '11. Governing Law & Dispute Resolution',
      badge: 'Jurisdiction',
      icon: Gavel,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India, without giving effect to any principles of conflicts of law.
          </p>
          <p className="text-xs text-[#7A6E5D]">
            Any legal dispute, controversy, or claim arising out of or relating to this Agreement shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru (Bangalore), Karnataka, India, or resolved through confidential, binding arbitration in Bengaluru, Karnataka under the Arbitration and Conciliation Act, 1996. Both parties waive any right to class action proceedings.
          </p>
        </div>
      ),
    },
    {
      id: 'modifications',
      title: '12. Revisions & Platform Updates',
      badge: 'Amendments',
      icon: RefreshCw,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>
            We may revise these Terms from time to time to reflect modifications in software features, regulatory mandates, or enterprise infrastructure standards. Any updates will be published with a revised &ldquo;Last Revised&rdquo; timestamp.
          </p>
          <p className="text-xs text-[#7A6E5D]">
            Continued access or use of WASP following the publication of updated Terms constitutes your binding acceptance of such revisions.
          </p>
        </div>
      ),
    },
    {
      id: 'contact',
      title: '13. Legal Counsel & Inquiries',
      badge: 'Contact',
      icon: Building2,
      content: (
        <div className="space-y-4 text-[#5C5040] leading-relaxed">
          <p>
            For legal inquiries, contract clarifications, enterprise licensing discussions, or formal compliance notices, please contact:
          </p>
          <div className="p-5 rounded-xl bg-gradient-to-br from-[#FAF8F5] via-[#FDFDFB] to-[#F3EEE3] border border-[#E5DCCB] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E2D4BF] via-[#BFA378] to-[#997C53] flex items-center justify-center text-white">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#2C241B]">Eagle Labs Legal Department</h4>
                <p className="text-xs text-[#8C7654]">Corporate Governance & Enterprise Licensing</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-[#5C5040]">
              <div><strong>Legal Counsel:</strong> eagle.labs@outlook.com</div>
              <div><strong>Enterprise Desk:</strong> eagle.labs@outlook.com</div>
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
      toast({ title: 'Terms of Service link copied to clipboard' });

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
              to="/privacy"
              className="text-xs font-sans font-semibold text-[#8C7654] hover:text-[#2C241B] px-3 py-1.5 rounded-full hover:bg-[#C5A880]/10 transition-colors"
            >
              Privacy Policy
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
            <Scale className="w-3.5 h-3.5" />
            Enterprise Service Agreement
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl  font-medium  bg-clip-text text-transparent bg-gradient-to-r from-[#2C241B] via-[#94764D] to-[#2C241B] leading-tight">
            Terms of Service
          </h1>
          <p className="text-md sm:text-md  text-[#5C5040] tracking-wide">
            The legal standards governing access, operational use, intellectual property, and mutual obligations.
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
          {/* Left Sticky Sidebar */}
          <aside className="hidden lg:block sticky top-24 space-y-5">
            <div className="bg-[#FAF8F5]/90 backdrop-blur-xl border border-[#E5DCCB] rounded-2xl p-4 shadow-sm space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#8C7654]">
                  Search Articles
                </span>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A59582]" />
                  <Input
                    type="text"
                    placeholder="Search terms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 pr-3 text-xs bg-white/60 border-[#E5DCCB] rounded-xl placeholder:text-[#A59582]/50 focus-visible:ring-[#C5A880]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#8C7654] block mb-2">
                  Clauses Index
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
                  to="/privacy"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/60 hover:bg-white border border-[#E5DCCB] text-xs font-sans text-[#2C241B] transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-3.5 h-3.5 text-[#8C7654]" />
                    <span>Privacy Policy</span>
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
                  Try clearing your search query &ldquo;{searchQuery}&rdquo; to view the complete terms document.
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

            {/* Bottom Cross-link */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FAF8F5] via-[#FDFDFB] to-[#F3EEE3] border border-[#E5DCCB] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-[#2C241B]">
                  Have privacy or data questions?
                </h3>
                <p className="text-xs text-[#7A6E5D] max-w-md">
                  Explore our Privacy Policy for details on encryption standards, subprocessors, and data portability.
                </p>
              </div>
              <Button
                onClick={() => navigate('/privacy')}
                className="rounded-full bg-[#2C241B] hover:bg-[#38322D] text-[#EFEAE2] text-xs font-semibold px-6 py-2.5 shadow-md transition-all hover:scale-105"
              >
                View Privacy Policy <ChevronRight className="w-3.5 h-3.5 ml-1" />
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

export default Terms;
