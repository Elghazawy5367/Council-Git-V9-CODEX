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
} from 'lucide-react';
import { toast } from 'sonner';
import { PersonaSelector } from './PersonaSelector';

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      setFileData({
        name: file.name,
        content,
        size: `${(file.size / 1024).toFixed(2)} KB`,
      });
      toast.success(`File "${file.name}" loaded`);
    } catch (error) {
      toast.error('Failed to read file');
    }

    event.target.value = '';
  };

  const handleFileRemove = () => {
    setFileData(null);
    toast.info('File context removed');
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
          <label className="text-sm font-medium text-foreground">File Context (Optional)</label>
          <input ref={fileInputRef} type="file" accept=".txt,.md,.json,.pdf,.docx,.csv" className="hidden" onChange={handleFileUpload} aria-label="Upload context file" />
          {fileData ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{fileData.name}</p>
                  <p className="text-xs text-muted-foreground">{fileData.size}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleFileRemove} aria-label="Remove uploaded file"><X className="h-4 w-4" /></Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full h-12 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload context file
            </Button>
          )}
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
