import React, { useState, useCallback, lazy, Suspense } from 'react';
import { useExpertStore } from '@/features/council/store/expert-store';
import { useControlPanelStore } from '@/features/council/store/control-panel-store';
import { KnowledgeFile, Expert } from '@/features/council/lib/types';
import { pluginManager } from '@/lib/plugin-manager';
import { SafeMarkdown } from '@/components/primitives/SafeMarkdown';
import { MAGNIFICENT_7_FLEET } from '@/lib/config';
import { EXPERT_POSITIONS, PERSONA_LIBRARY } from '@/features/council/lib/persona-library';
import { Card, CardContent, CardHeader } from '@/components/primitives/card';
import { Button } from '@/components/primitives/button';
import { Slider } from '@/components/primitives/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/primitives/select';
import { Textarea } from '@/components/primitives/textarea';
import { Badge } from '@/components/primitives/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/primitives/collapsible';
import {
  Brain,
  Cpu,
  Target,
  Heart,
  AlertTriangle,
  Pencil,
  Upload,
  FileText,
  ChevronDown,
  ChevronUp,
  Settings2,
  Loader2,
  X,
  Maximize2,
  RotateCcw,
  Sparkles,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { ExpertOutputFooter } from './ExpertOutputFooter';

// Lazy load the expanded modal
const ExpertExpandedModal = lazy(() => import('./ExpertExpandedModal'));

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  Cpu,
  Target,
  Heart,
  AlertTriangle,
};

interface ExpertCardProps {
  index: number;
}

export const ExpertCard: React.FC<ExpertCardProps> = ({ index }) => {
  const expert = useExpertStore(state => state.experts[index]);
  const updateExpert = useExpertStore(state => state.updateExpert);
  const addKnowledge = useExpertStore(state => state.addKnowledge);
  const removeKnowledge = useExpertStore(state => state.removeKnowledge);
  const activeExpertCount = useControlPanelStore(state => state.activeExpertCount);
  const clearPersona = useControlPanelStore(state => state.clearPersona);
  const isActive = index < activeExpertCount;

  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedPersona, setEditedPersona] = useState<string | undefined>();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Sync editedPersona with expert.basePersona only when expert changes, not on every render
  React.useEffect(() => {
    if (expert?.basePersona !== editedPersona) {
      setEditedPersona(expert?.basePersona);
    }
  }, [expert?.basePersona, editedPersona]); // Added editedPersona to dependencies

  // Define all hooks BEFORE any early returns
  const handleRetry = useCallback(() => {
    // Will be implemented later
    toast.info(`Retrying ${expert?.name}...`);
  }, [expert?.name]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const newKnowledge: KnowledgeFile[] = [];

      for (const file of Array.from(files)) {
        try {
          const content = await file.text();
          newKnowledge.push({
            id: `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            content,
            size: `${(file.size / 1024).toFixed(2)} KB`,
            type: file.type || 'text/plain',
          });
        } catch (error) {
          toast.error(`Failed to read ${file.name}`);
        }
      }

      if (newKnowledge.length > 0) {
        addKnowledge(index, newKnowledge);
        toast.success(`Added ${newKnowledge.length} file(s) to knowledge base`);
      }

      event.target.value = '';
    },
    [index, addKnowledge]
  );

  const handleModelChange = (modelId: string) => {
    updateExpert(index, { ...expert, model: modelId });
  };

  const handleConfigChange = (key: keyof Expert['config'], value: number) => {
    updateExpert(index, {
      ...expert,
      config: { ...expert.config, [key]: value },
    });
  };

  const handleSavePersona = () => {
    updateExpert(index, { ...expert, basePersona: editedPersona });
    setIsEditing(false);
    toast.success('Persona updated');
  };

  // Prevent render if expert is undefined (prevents crashes during state updates)
  if (!expert) {
    return (
      <Card className="glass-panel h-96 flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading expert...</div>
      </Card>
    );
  }

  const IconComponent = ICON_MAP[expert.icon] || Brain;
  const selectedModel = MAGNIFICENT_7_FLEET.find((m) => m.id === expert.model);
  
  const positionInfo = EXPERT_POSITIONS[index] || EXPERT_POSITIONS[0];
  const positionName = expert.positionName || positionInfo.position;
  
  const loadedPersona = expert.personaId ? PERSONA_LIBRARY[expert.personaId] : null;

  const handleClearPersonaClick = () => {
    clearPersona(index);
    toast.success(`${positionName} reset to default`);
  };

  return (
    <>
      <Card
        className={`glass-panel transition-all duration-300 flex flex-col h-full ${
          isActive ? 'ring-2 ring-primary/50 animate-pulse-glow' : 'opacity-60'
        } ${expert.isLoading ? 'animate-shimmer border-primary/40' : ''}`}
      >
        <CardHeader className="pb-2 flex-shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${expert.color} flex items-center justify-center shadow-lg flex-shrink-0 relative`}
              >
                <IconComponent className="w-5 h-5 text-primary-foreground" />
                {expert.hasWebSearch && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <Globe className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-sm truncate">{positionName}</h3>
                {loadedPersona ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-primary text-xs font-medium truncate">
                      {loadedPersona.icon} {loadedPersona.name}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground truncate">
                    {positionInfo.specialty}
                  </p>
                )}
                <p className="text-xs text-muted-foreground truncate">
                  {selectedModel?.name || 'Unknown Model'}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
              <div className="flex items-center gap-0.5">
                {expert.output && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-primary/10"
                    onClick={() => setIsExpanded(true)}
                    title="Expand output"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-primary/10"
                  onClick={() => setIsEditing(!isEditing)}
                  title="Edit persona"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
              {loadedPersona && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[9px] text-muted-foreground hover:text-destructive"
                  onClick={handleClearPersonaClick}
                  title="Reset to default"
                >
                  <RotateCcw className="h-2.5 w-2.5 mr-0.5" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {loadedPersona && (
            <Badge 
              variant="outline" 
              className="mt-2 text-[10px] bg-primary/5 border-primary/20 text-primary"
            >
              <Sparkles className="h-2.5 w-2.5 mr-1" />
              Persona: {expert.personaId}
            </Badge>
          )}

          <Select value={expert.model} onValueChange={handleModelChange}>
            <SelectTrigger className="mt-2 h-8 bg-muted/50 border-border/50 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MAGNIFICENT_7_FLEET.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-xs">{model.name}</span>
                    <span className="text-[10px] text-muted-foreground">{model.specialty}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-3 overflow-hidden">
          <div className="space-y-1.5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Knowledge
              </span>
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept=".txt,.md,.json,.pdf,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px]" asChild>
                  <span>
                    <Upload className="h-3 w-3 mr-1" />
                    Add
                  </span>
                </Button>
              </label>
            </div>

            {expert.knowledge.length > 0 ? (
              <div className="space-y-1 max-h-16 overflow-y-auto">
                {expert.knowledge.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-1 px-1.5 py-1 rounded-md bg-muted/30 text-[10px]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:bg-destructive/20 hover:text-destructive"
                      onClick={() => removeKnowledge(index, file.id)}
                    >
                      <X className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground/70 italic">No knowledge files</p>
            )}
          </div>

            <Collapsible open={isConfigOpen} onOpenChange={setIsConfigOpen} className="flex-shrink-0">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-7 px-2 hover:bg-muted/50"
                >
                  <span className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                    <Settings2 className="h-3 w-3" />
                    Config
                  </span>
                  {isConfigOpen ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                {expert.pluginId && pluginManager.getExpertPlugin(expert.pluginId) ? (
                  pluginManager.getExpertPlugin(expert.pluginId)?.renderConfig(expert.pluginConfig || {}, (newCfg) => {
                    updateExpert(index, { ...expert, pluginConfig: newCfg });
                  })
                ) : (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">Temperature</span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="h-4 px-1 text-[9px] border-primary/30">
                            {expert.config.temperature === 0 ? 'AUTO' : expert.config.temperature.toFixed(2)}
                          </Badge>
                          <span className="font-mono text-[9px]">
                            {expert.config.temperature === 0 ? 'Adaptive' : 'Manual'}
                          </span>
                        </div>
                      </div>
                      <Slider
                        value={[expert.config.temperature]}
                        onValueChange={([value]) => handleConfigChange('temperature', value)}
                        min={0}
                        max={2}
                        step={0.1}
                        className="slider-council"
                        aria-label={expert.config.temperature === 0
                          ? "Temperature set to AI Auto-Tuning"
                          : `Adjust temperature (currently ${expert.config.temperature})`}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">Context Tokens</span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="h-4 px-1 text-[9px] border-primary/30">
                            {expert.config.maxTokens === 0 ? 'ADAPTIVE' : expert.config.maxTokens}
                          </Badge>
                        </div>
                      </div>
                      <Slider
                        value={[expert.config.maxTokens]}
                        onValueChange={([value]) => handleConfigChange('maxTokens', value)}
                        min={0}
                        max={8000}
                        step={500}
                        className="slider-council"
                        aria-label={expert.config.maxTokens === 0
                          ? "Max tokens set to AI Adaptive Window"
                          : `Adjust max tokens (currently ${expert.config.maxTokens})`}
                      />
                    </div>
                  </>
                )}
              </CollapsibleContent>
            </Collapsible>

          {isEditing && (
            <div className="space-y-2 pt-2 border-t border-border/50 flex-shrink-0">
              <label className="text-[10px] font-medium text-muted-foreground">Base Persona</label>
              <Textarea
                value={editedPersona}
                onChange={(e) => setEditedPersona(e.target.value)}
                className="min-h-[80px] text-xs bg-muted/50 resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleSavePersona}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    setEditedPersona(expert.basePersona);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 flex flex-col">
            {expert.output && (
              <div className="space-y-1.5 flex-1 flex flex-col border-t border-border/50 pt-2">
                <div className="flex items-center justify-between flex-shrink-0">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    Output
                  </span>
                  {expert.isLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto rounded-md bg-muted/30 p-2 max-h-[300px]">
                  <SafeMarkdown content={expert.output} className="text-xs" />
                </div>
              </div>
            )}

            {expert.isLoading && !expert.output && (
              <div className="flex items-center justify-center py-4">
                <div className="flex flex-col items-center gap-1.5">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-[10px] text-muted-foreground">Analyzing...</span>
                </div>
              </div>
            )}
          </div>

          {expert.output && (
            <ExpertOutputFooter
              expert={{
                ...expert,
                content: expert.content || expert.output || 'No content available',
              }}
            />
          )}
        </CardContent>
      </Card>

      <Suspense fallback={null}>
        <ExpertExpandedModal
          expert={expert}
          isOpen={isExpanded}
          onClose={() => setIsExpanded(false)}
          onRetry={handleRetry}
        />
      </Suspense>
    </>
  );
};

export default ExpertExpandedModal;
