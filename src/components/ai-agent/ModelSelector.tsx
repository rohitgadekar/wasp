import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Zap,
  Code2,
  Brain,
  Cpu,
  Check,
  ChevronDown,
  Layers,
  Scale
} from 'lucide-react';
import { AVAILABLE_MODELS, AIModelConfig } from '@/lib/ai-models';
import { cn } from '@/lib/utils';
import { IoIosStar } from "react-icons/io";

interface ModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  disabled?: boolean;
  activeRoutedModel?: AIModelConfig | null;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelId,
  onSelectModel,
  disabled = false,
  activeRoutedModel
}) => {
  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];
  const isAuto = selectedModelId === 'auto';

  const getModelIcon = (id: string, category: string) => {
    switch (category) {
      case 'auto':
        return <IoIosStar className="w-3.5 h-3.5 text-amber-500 animate-pulse" />;
      case 'coding':
        return <Code2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'reasoning':
        return <Brain className="w-3.5 h-3.5 text-indigo-500" />;
      case 'fast':
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const getBadgeClass = (badge: string) => {
    if (badge.includes('SMART')) {
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    }
    if (badge.includes('CODE') || badge.includes('CODING')) {
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    }
    if (badge.includes('REASON')) {
      return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
    }
    if (badge.includes('100% FREE')) {
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    }
    if (badge.includes('1M') || badge.includes('FAST') || badge.includes('DEFAULT')) {
      return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30';
    }
    return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
  };

  const smartModels = AVAILABLE_MODELS.filter(m => m.category === 'auto');
  const freeSpecialized = AVAILABLE_MODELS.filter(m => m.category === 'coding' || m.category === 'reasoning' || (m.provider === 'openrouter' && m.category === 'general'));
  const geminiModels = AVAILABLE_MODELS.filter(m => m.provider === 'gemini' && m.id !== 'auto');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border flex items-center gap-1.5 shadow-sm group",
            isAuto
              ? "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/15 dark:hover:bg-amber-500/25 text-[#2C241B] hover:text-[#2C241B] dark:text-[#EAE6DF] dark:hover:text-white"
              : "bg-white/70 dark:bg-zinc-800/70 border-[#E5DCCB] dark:border-zinc-700 hover:bg-[#FAF8F5] dark:hover:bg-zinc-800 text-[#2C241B] hover:text-[#2C241B] dark:text-[#EAE6DF] dark:hover:text-white"
          )}
        >
          <span className="flex items-center justify-center shrink-0">
            {getModelIcon(currentModel.id, currentModel.category)}
          </span>

          <span className="font-semibold text-[11px] truncate max-w-[110px] md:max-w-[140px] group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
            {isAuto && activeRoutedModel
              ? `Auto: ${activeRoutedModel.shortName}`
              : currentModel.shortName}
          </span>

          <Badge
            variant="outline"
            className={cn(
              "text-[8.5px] px-1.5 py-0 h-4 uppercase font-bold tracking-wider shrink-0 hidden sm:inline-flex border",
              getBadgeClass(currentModel.badge)
            )}
          >
            {currentModel.badge.replace('⚡ ', '')}
          </Badge>

          <ChevronDown className="w-3 h-3 text-muted-foreground/60 transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-[340px] md:w-[380px] p-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-[#E5DCCB] dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50"
      >
        <div className="max-h-[460px] overflow-y-auto custom-scrollbar p-2 pr-1.5">
          {/* Header Info */}
        <div className="px-2.5 py-2 mb-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2C241B] dark:text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#8C7654]" />
              AI Model & Token Routing
            </h4>
            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
              <Scale className="w-3 h-3 text-emerald-500" />
              Token Saver
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
            Choose a dedicated model or leave on <strong className="text-foreground">Smart Router</strong> to auto-distribute load and conserve tokens.
          </p>
        </div>

        {/* Section: Smart Router */}
        {smartModels.map(model => {
          const isSelected = selectedModelId === model.id;
          return (
            <div key={model.id} className="mb-2">
              <DropdownMenuItem
                onClick={() => onSelectModel(model.id)}
                className={cn(
                  "flex flex-col items-start gap-1 p-2.5 rounded-xl cursor-pointer transition-all border outline-none",
                  isSelected
                    ? "bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-amber-500/40 shadow-sm hover:bg-amber-500/20 focus:bg-amber-500/20"
                    : "hover:bg-amber-500/10 focus:bg-amber-500/10 border-transparent"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <IoIosStar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#2C241B] dark:text-white">
                          {model.name}
                        </span>
                        <Badge variant="outline" className={cn("text-[8px] px-1.5 py-0 h-3.5 uppercase font-bold", getBadgeClass(model.badge))}>
                          RECOMMENDED
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-500 shrink-0" />}
                </div>
                <p className="text-[10.5px] text-muted-foreground leading-relaxed pl-8">
                  {model.description}
                </p>
                <div className="flex items-center gap-2 pl-8 pt-0.5">
                  <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    ⚡ Auto Token Minimizer
                  </span>
                  <span className="text-[9px] text-muted-foreground/80">
                    Avoids single-model rate limits
                  </span>
                </div>
              </DropdownMenuItem>
            </div>
          );
        })}

        <DropdownMenuSeparator className="my-1.5 bg-[#E5DCCB]/40 dark:bg-zinc-800" />

        {/* Section: Specialized Free Models */}
        <DropdownMenuLabel className="text-[9.5px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2 py-1">
          Free Specialized Models (Open Weights)
        </DropdownMenuLabel>

        <div className="space-y-1">
          {freeSpecialized.map(model => {
            const isSelected = selectedModelId === model.id;
            return (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onSelectModel(model.id)}
                className={cn(
                  "flex items-start justify-between p-2 rounded-xl cursor-pointer transition-all border outline-none",
                  isSelected
                    ? "bg-[#E5DCCB]/40 dark:bg-zinc-800 border-[#C5A880]/50"
                    : "hover:bg-black/5 dark:hover:bg-white/5 border-transparent"
                )}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {getModelIcon(model.id, model.category)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-[#2C241B] dark:text-white">
                        {model.name}
                      </span>
                      <Badge variant="outline" className={cn("text-[8px] px-1 py-0 h-3.5 uppercase font-bold", getBadgeClass(model.badge))}>
                        {model.badge}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                      {model.description}
                    </p>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2 mt-1" />}
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator className="my-1.5 bg-[#E5DCCB]/40 dark:bg-zinc-800" />

        {/* Section: Google Gemini Models */}
        <DropdownMenuLabel className="text-[9.5px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2 py-1">
          Google Gemini Models
        </DropdownMenuLabel>

        <div className="space-y-1">
          {geminiModels.map(model => {
            const isSelected = selectedModelId === model.id;
            return (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onSelectModel(model.id)}
                className={cn(
                  "flex items-start justify-between p-2 rounded-xl cursor-pointer transition-all border outline-none",
                  isSelected
                    ? "bg-[#E5DCCB]/40 dark:bg-zinc-800 border-[#C5A880]/50"
                    : "hover:bg-black/5 dark:hover:bg-white/5 border-transparent"
                )}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {getModelIcon(model.id, model.category)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-[#2C241B] dark:text-white">
                        {model.name}
                      </span>
                      <Badge variant="outline" className={cn("text-[8px] px-1 py-0 h-3.5 uppercase font-bold", getBadgeClass(model.badge))}>
                        {model.badge}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                      {model.description}
                    </p>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2 mt-1" />}
              </DropdownMenuItem>
            );
          })}
        </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ModelSelector;
