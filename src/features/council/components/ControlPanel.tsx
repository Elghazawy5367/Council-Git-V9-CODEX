import React, { useRef } from 'react';
import { useCouncilStore } from '@/stores/council.store';
import { useSettingsStore } from '@/features/settings/store/settings-store';
import { useShallow } from 'zustand/react/shallow';
import { JUDGE_MODE_DESCRIPTIONS } from '@/lib/config';
import { SynthesisConfig } from '@/features/council/lib/types';
import { Card, CardContent } from '@/components/primitives/card';
import { Button } from '@/components/primitives/button';
import { Textarea } from '@/components/primitives/textarea';
import { Slider } from '@/components/primitives/slider';
import { Badge } from '@/components/primitives/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/primitives/tabs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/primitives/dropdown-menu';
import { useExecuteSynthesis } from '@/features/council/hooks/use-council-queries';
import {
  Settings,
  Upload,
  FileText,
  X,
  Loader2,
  Play,
  Target,
  MessageSquare,
  Gavel,
  CheckCircle,
  Plus,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon,
  File as FileIcon,
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import { PersonaSelector } from './PersonaSelector';

// File format categories for the dropdown menu
const FILE_CATEGORIES = [
  {
    label: 'Documents',
    icon: FileText,
    accept: '.pdf,.doc,.docx,.txt,.rtf',
    description: 'PDF, Word, TXT, RTF',
  },
  {
    label: 'Code Files',
    icon: FileCode,
    accept: '.js,.ts,.tsx,.jsx,.py,.java,.go,.rs,.cpp,.c,.h,.rb,.php,.swift,.kt,.html,.css,.scss',
    description: 'JS, TS, Python, Java, Go, HTML, CSS...',
  },
  {
    label: 'Data Files',
    icon: FileSpreadsheet,
    accept: '.json,.csv,.xml,.yaml,.yml,.xlsx,.xls,.toml,.ini',
    description: 'JSON, CSV, XML, YAML, Excel...',
  },
  {
    label: 'Text & Notes',
    icon: FileIcon,
    accept: '.md,.log,.conf,.env,.sh,.bash,.zsh,.bat,.ps1',
    description: 'Markdown, Logs, Config, Shell...',
  },
  {
    label: 'Images',
    icon: ImageIcon,
    accept: '.png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.ico',
    description: 'PNG, JPG, GIF, WebP, SVG...',
  },
] as const;

const ALL_ACCEPTED_FORMATS = FILE_CATEGORIES.map(c => c.accept).join(',');

// Judge mode icons
const JUDGE_MODE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'ruthless-judge': Gavel,
  'consensus-judge': CheckCircle,
  'debate-judge': MessageSquare,
  'pipeline-judge': Target,
};

import { FeatureConfigModal } from './FeatureConfigModal';

export const ControlPanel: React.FC = () => {
  const [isConfigOpen, setIsConfigOpen] = React.useState(false);
  const [selectedFeatureTab, setSelectedFeatureTab] = React.useState<string | null>(null);

  const handleOpenConfig = (tab?: string) => {
    setSelectedFeatureTab(tab || null);
    setIsConfigOpen(true);
  };

  const {
    task,
    setTask,
    judgeMode,
    setJudgeMode,
    activeExpertCount,
    setActiveExpertCount,
    fileData,
    addFileData,
    removeFileData,
    setFileData,
    executionPhase,
    isLoading,
    isSynthesizing,
    statusMessage,
    executePhase1,
    executePhase2,
  } = useCouncilStore(useShallow((state) => ({
    task: state.task,
    setTask: state.setTask,
    judgeMode: state.judgeMode,
    setJudgeMode: state.setJudgeMode,
    activeExpertCount: state.activeExpertCount,
    setActiveExpertCount: state.setActiveExpertCount,
    fileData: state.fileData,
    addFileData: state.addFileData,
    removeFileData: state.removeFileData,
    setFileData: state.setFileData,
    executionPhase: state.executionPhase,
    isLoading: state.isLoading,
    isSynthesizing: state.isSynthesizing,
    statusMessage: state.statusMessage,
    executePhase1: state.executePhase1,
    executePhase2: state.executePhase2,
  })));

  const { vaultStatus, setShowSettings } = useSettingsStore(useShallow((state) => ({ 
    vaultStatus: state.vaultStatus, 
    setShowSettings: state.setShowSettings 
  })));
  
  const synthesisMutation = useExecuteSynthesis();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentAccept, setCurrentAccept] = React.useState(ALL_ACCEPTED_FORMATS);
  const [currentLabel, setCurrentLabel] = React.useState('context files');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let successCount = 0;
    for (const file of Array.from(files)) {
      try {
        const content = await file.text();
        addFileData({
          name: file.name,
          content,
          size: `${(file.size / 1024).toFixed(2)} KB`,
        });
        successCount++;
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unreadable format';
        toast.error(`Failed to read "${file.name}": ${reason}`);
      }
    }
    if (successCount > 0) {
      toast.success(`Added ${successCount} file(s)`);
    }
    event.target.value = '';
  };

  const triggerFileInput = (accept: string, label: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      setCurrentAccept(accept);
      setCurrentLabel(label);
      fileInputRef.current.click();
    }
  };

  const handleRemoveAll = () => {
    setFileData([]);
    toast.info('All files removed');
  };

  const handlePhase1Click = () => {
    if (vaultStatus.isLocked) {
      setShowSettings(true);
      toast.error('Please unlock the vault first');
      return;
    }
    if (!task.trim()) {
      toast.error('Please enter a task');
      return;
    }

    executePhase1();
  };

  const handlePhase2Click = () => {
    if (executionPhase !== 'phase1-complete') {
      toast.error('Please run Phase 1 (Run Council) first');
      return;
    }

    executePhase2(synthesisMutation);
  };

  const isPhase1Running = isLoading && executionPhase === 'phase1-experts';
  const isPhase2Running = isSynthesizing && executionPhase === 'phase2-synthesis';
  const canRunPhase1 = !isLoading && executionPhase !== 'phase1-experts';
  const canRunPhase2 = executionPhase === 'phase1-complete' && !isSynthesizing;

  return (
    <Card className="glass-panel-elevated">
      <CardContent className="p-6 space-y-6">
        <PersonaSelector />

        <div className="space-y-2">
          <label htmlFor="council-task" className="text-sm font-medium text-foreground">Task / Question</label>
          <Textarea
            id="council-task"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Describe the task or question you want the Council to analyze..."
            className="min-h-[120px] bg-muted/50 border-border/50 resize-none focus:ring-primary/50"
          />
        </div>

        {/* Phase 1 Section: Expert Configuration */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Phase 1: Expert Configuration</label>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
              onClick={() => setShowSettings(true)}
              title="Configure synthesis settings"
              aria-label="Configure synthesis settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">All experts will analyze in parallel</p>
          
          <div className="space-y-5">
            <div className="flex justify-between items-center gap-4">
              <label htmlFor="active-experts-slider" className="text-sm font-medium text-foreground">Active Experts</label>
              <Badge variant="secondary" className="font-mono text-base px-4 py-1" aria-live="polite">{activeExpertCount}</Badge>
            </div>
            <div className="px-2">
              <Slider
                id="active-experts-slider"
                value={[activeExpertCount]}
                onValueChange={([value]) => setActiveExpertCount(value)}
                min={1}
                max={5}
                step={1}
                className="slider-council"
                aria-label={`Active experts: ${activeExpertCount}`}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-3">
              <span className="font-medium">1</span>
              <span className="font-medium">5</span>
            </div>
          </div>
        </div>

        {/* Phase 2 Section: Judge Mode Selection */}
        {executionPhase === 'phase1-complete' && (
          <div className="space-y-3 border-t pt-4 border-primary/20 bg-primary/5 -mx-6 px-6 py-4 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Phase 2: Judge Mode Selection</label>
            </div>
            <p className="text-xs text-muted-foreground">Select how the judge will synthesize expert insights</p>
            <Tabs value={judgeMode} onValueChange={setJudgeMode} className="w-full pb-4">
              <TabsList className="grid grid-cols-2 w-full bg-muted/50 p-3 gap-3">
                {Object.keys(JUDGE_MODE_DESCRIPTIONS).map((modeKey) => {
                  const IconComponent = JUDGE_MODE_ICONS[modeKey] || Gavel;
                  const modeInfo = JUDGE_MODE_DESCRIPTIONS[modeKey];
                  return (
                    <TabsTrigger
                      key={modeKey}
                      value={modeKey}
                      className="flex flex-col items-center justify-center gap-1.5 min-w-[80px] px-2 py-4 text-xs font-medium min-h-[60px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-primary-foreground"
                    >
                      <IconComponent className="h-5 w-5 flex-shrink-0" />
                      <span className="text-xs leading-snug text-center">{modeInfo.name}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground leading-relaxed">{JUDGE_MODE_DESCRIPTIONS[judgeMode]?.description}</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">File Context (Optional)</label>
            {fileData.length > 0 && (
              <button
                onClick={handleRemoveAll}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Remove all
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept={currentAccept} multiple className="hidden" onChange={handleFileUpload} aria-label={`Upload ${currentLabel}`} />
          
          {/* Attached files list */}
          {fileData.length > 0 && (
            <div className="space-y-2">
              {fileData.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.size}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => removeFileData(index)} aria-label={`Remove ${file.name}`}><X className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
          )}

          {/* + Add Files dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full h-11 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 gap-2">
                <Plus className="h-4 w-4" />
                {fileData.length === 0 ? 'Add Context Files' : 'Add More Files'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[280px]">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Paperclip className="h-3.5 w-3.5" />
                Select File Type
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {FILE_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <DropdownMenuItem
                    key={category.label}
                    onClick={() => triggerFileInput(category.accept, category.label.toLowerCase())}
                    className="flex items-center gap-3 py-2.5 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{category.label}</p>
                      <p className="text-xs text-muted-foreground">{category.description}</p>
                    </div>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => triggerFileInput(ALL_ACCEPTED_FORMATS, 'files')}
                className="flex items-center gap-3 py-2.5 cursor-pointer"
              >
                <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">All Supported Formats</p>
                  <p className="text-xs text-muted-foreground">Browse all file types</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 border-red-500/20 hover:bg-red-500/10 text-xs"
            onClick={() => handleOpenConfig('reddit-sniper')}
          >
            <Target className="h-3.5 w-3.5 text-red-500" />
            Reddit Sniper
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 border-orange-500/20 hover:bg-orange-500/10 text-xs"
            onClick={() => handleOpenConfig('reddit-pain-points')}
          >
            <MessageSquare className="h-3.5 w-3.5 text-orange-500" />
            Reddit Pain
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 border-violet-500/20 hover:bg-violet-500/10 text-xs"
            onClick={() => handleOpenConfig('scout')}
          >
            <span className="text-sm">👻</span>
            Phantom Scout
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 border-cyan-500/20 hover:bg-cyan-500/10 text-xs"
            onClick={() => handleOpenConfig('viral-radar')}
          >
            <span className="text-sm">📡</span>
            Viral Radar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 border-emerald-500/20 hover:bg-emerald-500/10 text-xs"
            onClick={() => handleOpenConfig('heist')}
          >
            <span className="text-sm">🎭</span>
            The HEIST
          </Button>
        </div>

        {/* Two-Phase Execution Buttons */}
        <div className="space-y-3">
          {/* Phase 1 Button */}
          <Button 
            className="w-full h-14 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30" 
            onClick={handlePhase1Click} 
            disabled={!canRunPhase1 || !task.trim()}
            aria-label={isPhase1Running ? 'Phase 1 running' : executionPhase === 'phase1-complete' || executionPhase === 'complete' ? 'Phase 1 complete' : 'Run Council Phase 1'}
          >
            {isPhase1Running ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Phase 1: Running...</>
            ) : executionPhase === 'phase1-complete' || executionPhase === 'complete' ? (
              <><CheckCircle className="h-5 w-5 mr-2" />Phase 1 Complete</>
            ) : (
              <><Play className="h-5 w-5 mr-2" />Run Council (Phase 1)</>
            )}
          </Button>

          {/* Phase 2 Button - Only shown after Phase 1 completes */}
          {(executionPhase === 'phase1-complete' || executionPhase === 'complete') && (
            <Button 
              className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-primary-foreground font-semibold text-lg shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30" 
              onClick={handlePhase2Click} 
              disabled={!canRunPhase2}
              aria-label={isPhase2Running ? 'Phase 2 synthesizing' : executionPhase === 'complete' ? 'Phase 2 complete' : 'Run Judge Phase 2'}
            >
              {isPhase2Running ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Phase 2: Synthesizing...</>
              ) : executionPhase === 'complete' ? (
                <><CheckCircle className="h-5 w-5 mr-2" />Phase 2 Complete</>
              ) : (
                <><Gavel className="h-5 w-5 mr-2" />Run Judge (Phase 2)</>
              )}
            </Button>
          )}
        </div>

        <FeatureConfigModal 
          isOpen={isConfigOpen} 
          onClose={() => setIsConfigOpen(false)} 
          initialTab={selectedFeatureTab}
        />

        {(isLoading || isSynthesizing) && statusMessage && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
            {statusMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ControlPanel;
