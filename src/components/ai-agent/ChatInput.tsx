import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Code2, Brain, Zap, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ModelSelector } from './ModelSelector';
import { AIModelConfig, AI_SKILLS, AISkill, parseSkillCommand } from '@/lib/ai-models';
import { IoIosStar } from "react-icons/io";
import { VscCircleLarge, VscCircleSmallFilled } from "react-icons/vsc";

interface ChatInputProps {
  onSubmit: (input: string) => void;
  isLoading: boolean;
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  activeRoutedModel?: AIModelConfig | null;
}

const ChatInput = ({
  onSubmit,
  isLoading,
  selectedModelId,
  onSelectModel,
  activeRoutedModel
}: ChatInputProps) => {
  const [input, setInput] = useState('');
  const [showSkillMenu, setShowSkillMenu] = useState(false);
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect active skill from input
  const activeSkill = AI_SKILLS.find(s =>
    input.trim() === s.command || input.trim().startsWith(s.command + ' ')
  );

  const { skill: parsedSkill, cleanedInput: parsedQuery } = parseSkillCommand(input);

  // Filter skills when user is typing a slash command
  const isSlashTyping = input.startsWith('/') && !input.includes(' ') && input.length <= 15;
  const slashQuery = isSlashTyping ? input.slice(1).toLowerCase() : '';
  const filteredSkills = isSlashTyping
    ? AI_SKILLS.filter(s =>
      s.command.slice(1).toLowerCase().startsWith(slashQuery) ||
      s.name.toLowerCase().includes(slashQuery)
    )
    : AI_SKILLS;

  const handleSelectSkill = (skill: AISkill) => {
    onSelectModel(skill.targetModelId);
    const nextVal = `${skill.command} `;
    setInput(nextVal);
    setShowSkillMenu(false);
    setSelectedSkillIndex(0);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextVal.length, nextVal.length);
      }
    }, 10);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // If input is ONLY a skill command (e.g. "/code", "/reason", "/fast", "/smart"), do NOT send message
    const exactSkill = AI_SKILLS.find(s => s.command.toLowerCase() === trimmed.toLowerCase());
    if (exactSkill) {
      handleSelectSkill(exactSkill);
      return;
    }

    // If a skill is active but no prompt text follows, do NOT send message
    if (parsedSkill && !parsedQuery) {
      handleSelectSkill(parsedSkill);
      return;
    }

    onSubmit(trimmed);
    setInput('');
    setShowSkillMenu(false);
    setSelectedSkillIndex(0);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Navigate and select from open slash skill menu
    if (showSkillMenu && filteredSkills.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSkillIndex(prev => (prev + 1) % filteredSkills.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSkillIndex(prev => (prev - 1 + filteredSkills.length) % filteredSkills.length);
        return;
      }
      if ((e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey) {
        e.preventDefault();
        const chosen = filteredSkills[selectedSkillIndex] || filteredSkills[0];
        if (chosen) {
          handleSelectSkill(chosen);
        }
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      const trimmed = input.trim();

      // 1. If input matches a skill command exactly, select skill instead of sending
      const exactSkill = AI_SKILLS.find(s => s.command.toLowerCase() === trimmed.toLowerCase());
      if (exactSkill) {
        handleSelectSkill(exactSkill);
        return;
      }

      // 2. If a skill is typed but no actual question follows, select skill and wait for input
      if (parsedSkill && !parsedQuery) {
        handleSelectSkill(parsedSkill);
        return;
      }

      handleSubmit();
      return;
    }

    if (e.key === 'Escape') {
      setShowSkillMenu(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    // Show skill popup if user typed a single "/" or started typing a slash command
    if (val.startsWith('/') && !val.includes(' ') && val.length <= 15) {
      setShowSkillMenu(true);
      setSelectedSkillIndex(0);
    } else {
      setShowSkillMenu(false);
    }
  };

  const handleClearSkill = () => {
    if (activeSkill) {
      const rest = input.replace(new RegExp(`^\\${activeSkill.command}\\s*`), '');
      setInput(rest);
    }
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 192)}px`;
    }
  }, [input]);

  const getSkillIcon = (iconName: string) => {
    switch (iconName) {
      case 'code':
        return <Code2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'brain':
        return <Brain className="w-3.5 h-3.5 text-indigo-500" />;
      case 'zap':
        return <Zap className="w-3.5 h-3.5 text-sky-500" />;
      default:
        return <IoIosStar className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-10 pb-6 px-4 z-50 pointer-events-none">
      <div className="max-w-4xl mx-auto w-full pointer-events-auto relative">
        {/* Floating Slash Skills Menu (Cursor / Raycast style) */}
        {showSkillMenu && filteredSkills.length > 0 && (
          <div className="absolute bottom-full mb-3 left-4 right-4 md:left-6 md:w-96 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-[#E5DCCB] dark:border-zinc-800 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="px-2.5 py-1.5 border-b border-black/5 dark:border-white/5 mb-1 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                <VscCircleLarge className="w-3 h-3 text-amber-500" />
                AI Skills & Direct Routing
              </span>
              <span className="text-[9px] text-muted-foreground font-mono">Enter / Tab to select</span>
            </div>

            <div className="space-y-1">
              {filteredSkills.map((skill, index) => (
                <button
                  key={skill.command}
                  type="button"
                  onClick={() => handleSelectSkill(skill)}
                  className={cn(
                    "w-full text-left p-2 rounded-xl transition-colors flex items-start gap-2.5 group cursor-pointer",
                    index === selectedSkillIndex
                      ? "bg-[#C5A880]/15 dark:bg-white/10 text-[#2C241B] dark:text-white"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <div className="mt-0.5 p-1 rounded-md bg-black/5 dark:bg-white/5 group-hover:scale-110 transition-transform">
                    {getSkillIcon(skill.iconName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#2C241B] dark:text-white font-mono">
                        {skill.command}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {skill.name}
                      </span>
                      <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 uppercase font-bold ml-auto">
                        {skill.badge}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                      {skill.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          {/* Glow effect on focus */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 rounded-[1.75rem] opacity-0 peer-focus-within:opacity-100 transition-opacity duration-700 blur-sm pointer-events-none" />

          <div className={cn(
            "relative flex w-full flex-col bg-white dark:bg-zinc-900 rounded-[2rem] border transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]",
            activeSkill
              ? "border-[#C5A880] shadow-[0_4px_32px_rgba(197,168,128,0.2)]"
              : input
                ? "border-[#C5A880]/60 shadow-[0_4px_32px_rgba(197,168,128,0.15)]"
                : "border-[#E5DCCB] dark:border-zinc-800"
          )}>
            {/* Active Skill Indicator Badge inside textarea top */}
            {activeSkill && (
              <div className="flex items-center justify-between px-6 pt-3 pb-1">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#8C7654] dark:text-amber-400 text-[11px] font-semibold animate-in fade-in duration-200">
                  {getSkillIcon(activeSkill.iconName)}
                  <span>Skill Active: <strong>{activeSkill.name}</strong></span>
                  <span className="text-[9px] opacity-70 ml-1">({activeSkill.command})</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearSkill}
                  className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground/60 hover:text-foreground transition-colors"
                  title="Remove skill"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask Nyra anything or type /code or /reason for dedicated skills..."
              rows={1}
              className={cn(
                "w-full bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-6 resize-none text-[15px] font-normal placeholder:text-muted-foreground/40 custom-scrollbar leading-relaxed",
                activeSkill ? "pt-2 pb-3" : "pt-5 pb-3"
              )}
              disabled={isLoading}
            />

            <div className="flex items-center justify-between px-4 pb-3 pt-1 gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <ModelSelector
                  selectedModelId={selectedModelId}
                  onSelectModel={onSelectModel}
                  disabled={isLoading}
                  activeRoutedModel={activeRoutedModel}
                />

                {/* Quick Skill Shortcut Chips */}
                {!activeSkill && (
                  <div className="hidden sm:flex items-center gap-1 pl-1">
                    <button
                      type="button"
                      onClick={() => handleSelectSkill(AI_SKILLS[0])}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all flex items-center gap-1 hover:scale-105 active:scale-95"
                      title="Activate Code Specialist Skill"
                    >
                      <Code2 className="w-3 h-3" />
                      <span>/code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSkill(AI_SKILLS[1])}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-all flex items-center gap-1 hover:scale-105 active:scale-95"
                      title="Activate Deep Reasoning Skill"
                    >
                      <Brain className="w-3 h-3" />
                      <span>/reason</span>
                    </button>
                  </div>
                )}

                <span className="hidden lg:inline-block text-[8px] uppercase tracking-widest text-muted-foreground/30 font-bold pl-1 select-none">
                  Shift + Enter for new line
                </span>
              </div>

              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim() || (!!parsedSkill && !parsedQuery)}
                className={cn(
                  "rounded-full w-10 h-10 shrink-0 transition-all duration-300",
                  input.trim() && (!parsedSkill || parsedQuery)
                    ? "bg-[#2C241B] hover:bg-[#38322D] text-white shadow-md hover:scale-105 active:scale-95"
                    : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground cursor-not-allowed"
                )}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;
