import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/primitives/dialog';
import { Button } from '@/components/primitives/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/primitives/tabs';
import { Label } from '@/components/primitives/label';
import { Input } from '@/components/primitives/input';
import { Textarea } from '@/components/primitives/textarea';
import { Switch } from '@/components/primitives/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/primitives/select';
import { Slider } from '@/components/primitives/slider';
import type { FeatureDefinition, FeatureConfiguration } from '../types/feature.types';
import { useFeaturesStore } from '../store/features-store';

interface FeatureConfigModalProps {
  feature: FeatureDefinition;
  isOpen: boolean;
  onClose: () => void;
}

export function FeatureConfigModal({ feature, isOpen, onClose }: FeatureConfigModalProps): JSX.Element {
  const [config, setConfig] = useState<FeatureConfiguration>(feature.defaultConfig);
  const updateFeatureConfig = useFeaturesStore((state) => state.updateFeatureConfig);

  const handleSave = (): void => {
    updateFeatureConfig(feature.id, config);
    onClose();
  };

  const handleReset = (): void => {
    setConfig(feature.defaultConfig);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{feature.icon}</span>
            {feature.name} - Configuration
          </DialogTitle>
          <DialogDescription>
            Configure how this feature runs and processes data
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="execution" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="execution">Execution</TabsTrigger>
            <TabsTrigger value="targets">Targets</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
          </TabsList>

          {/* Execution Settings Tab */}
          <TabsContent value="execution" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Feature</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow this feature to run
                  </p>
                </div>
                <Switch
                  checked={config?.enabled ?? false}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Run Mode</Label>
                <Select
                  value={config?.runMode ?? 'manual'}
                  onValueChange={(value: 'manual' | 'scheduled' | 'triggered') =>
                    setConfig({ ...config, runMode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="triggered">Triggered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config?.runMode === 'scheduled' && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">Schedule Configuration</h4>
                  
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={config.schedule?.frequency ?? 'daily'}
                      onValueChange={(value: 'hourly' | 'daily' | 'weekly' | 'monthly') =>
                        setConfig({
                          ...config,
                          schedule: { ...(config.schedule || { interval: 1, timezone: 'UTC' }), frequency: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Interval</Label>
                    <Input
                      type="number"
                      min={1}
                      value={config.schedule?.interval || 1}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          schedule: {
                            ...(config.schedule || { frequency: 'daily', timezone: 'UTC' }),
                            interval: parseInt(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium">Execution Limits</h4>
                
                <div className="space-y-2">
                  <Label>Max Run Time (seconds)</Label>
                  <Input
                    type="number"
                    value={config?.limits?.maxRunTime ?? 300}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        limits: { ...(config?.limits || {}), maxRunTime: parseInt(e.target.value) } as any,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max API Requests</Label>
                  <Input
                    type="number"
                    value={config?.limits?.maxAPIRequests ?? 100}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        limits: { ...(config?.limits || {}), maxAPIRequests: parseInt(e.target.value) } as any,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Retry Attempts</Label>
                  <Input
                    type="number"
                    value={config?.limits?.retryAttempts ?? 3}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        limits: { ...(config?.limits || {}), retryAttempts: parseInt(e.target.value) } as any,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Targets Tab */}
          <TabsContent value="targets" className="space-y-4 mt-4">
            {config?.targets?.github && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">GitHub Targets</h4>
                
                <div className="space-y-2">
                  <Label>Topics (comma-separated)</Label>
                  <Input
                    value={config.targets.github.topics?.join(', ') || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        targets: {
                          ...config.targets,
                          github: {
                            ...config.targets.github!,
                            topics: e.target.value.split(',').map((s) => s.trim()),
                          },
                        },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Languages (comma-separated)</Label>
                  <Input
                    value={config.targets.github.languages?.join(', ') || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        targets: {
                          ...config.targets,
                          github: {
                            ...config.targets.github!,
                            languages: e.target.value.split(',').map((s) => s.trim()),
                          },
                        },
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Stars</Label>
                    <Input
                      type="number"
                      value={config.targets.github.stars?.min || 0}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          targets: {
                            ...config.targets,
                            github: {
                              ...config.targets.github!,
                              stars: {
                                ...config.targets.github!.stars,
                                min: parseInt(e.target.value),
                              },
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Stars</Label>
                    <Input
                      type="number"
                      value={config.targets.github.stars?.max || 0}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          targets: {
                            ...config.targets,
                            github: {
                              ...config.targets.github!,
                              stars: {
                                ...config.targets.github!.stars,
                                max: parseInt(e.target.value),
                              },
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {config?.targets?.reddit && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Reddit Targets</h4>
                
                <div className="space-y-2">
                  <Label>Subreddits (comma-separated)</Label>
                  <Input
                    value={config.targets.reddit.subreddits?.join(', ') || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        targets: {
                          ...config.targets,
                          reddit: {
                            ...config.targets.reddit!,
                            subreddits: e.target.value.split(',').map((s) => s.trim()),
                          },
                        },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Keywords (comma-separated)</Label>
                  <Input
                    value={config.targets.reddit.keywords?.join(', ') || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        targets: {
                          ...config.targets,
                          reddit: {
                            ...config.targets.reddit!,
                            keywords: e.target.value.split(',').map((s) => s.trim()),
                          },
                        },
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Upvotes</Label>
                    <Input
                      type="number"
                      value={config.targets.reddit.minUpvotes || 0}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          targets: {
                            ...config.targets,
                            reddit: {
                              ...config.targets.reddit!,
                              minUpvotes: parseInt(e.target.value),
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Comments</Label>
                    <Input
                      type="number"
                      value={config.targets.reddit.minComments || 0}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          targets: {
                            ...config.targets,
                            reddit: {
                              ...config.targets.reddit!,
                              minComments: parseInt(e.target.value),
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {config?.targets?.niches && (
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Niche Specification</h4>
                
                <div className="space-y-2">
                  <Label>Primary Niche</Label>
                  <Input
                    value={config.targets.niches.primary || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        targets: {
                          ...config.targets,
                          niches: {
                            ...(config.targets.niches || { keywords: [], excludedKeywords: [] }),
                            primary: e.target.value,
                          },
                        },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Keywords (comma-separated)</Label>
                  <Textarea
                    value={config.targets.niches.keywords?.join(', ') || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        targets: {
                          ...config.targets,
                          niches: {
                            ...(config.targets.niches || { primary: '', excludedKeywords: [] }),
                            keywords: e.target.value.split(',').map((s) => s.trim()),
                          },
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </TabsContent>

          {/* Processing Tab */}
          <TabsContent value="processing" className="space-y-4 mt-4">
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">Analysis Settings</h4>
              
              <div className="flex items-center justify-between">
                <Label>Enable Sentiment Analysis</Label>
                <Switch
                  checked={config?.processing?.analysis?.enableSentiment ?? false}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      processing: {
                        ...(config.processing || { filters: {} }),
                        analysis: {
                          ...(config.processing?.analysis || { enableTrending: false, enablePainPoints: false, enableOpportunities: false, deepAnalysis: false }),
                          enableSentiment: checked,
                        },
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Enable Pain Point Detection</Label>
                <Switch
                  checked={config?.processing?.analysis?.enablePainPoints ?? false}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      processing: {
                        ...(config.processing || { filters: {} }),
                        analysis: {
                          ...(config.processing?.analysis || { enableSentiment: false, enableTrending: false, enableOpportunities: false, deepAnalysis: false }),
                          enablePainPoints: checked,
                        },
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Enable Opportunity Identification</Label>
                <Switch
                  checked={config?.processing?.analysis?.enableOpportunities ?? false}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      processing: {
                        ...(config.processing || { filters: {} }),
                        analysis: {
                          ...(config.processing?.analysis || { enableSentiment: false, enableTrending: false, enablePainPoints: false, deepAnalysis: false }),
                          enableOpportunities: checked,
                        },
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Deep Analysis (AI-Enhanced)</Label>
                <Switch
                  checked={config?.processing?.analysis?.deepAnalysis ?? false}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      processing: {
                        ...(config.processing || { filters: {} }),
                        analysis: {
                          ...(config.processing?.analysis || { enableSentiment: false, enableTrending: false, enablePainPoints: false, enableOpportunities: false }),
                          deepAnalysis: checked,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">Filters</h4>
              
              <div className="space-y-2">
                <Label>Min Quality Score</Label>
                <Slider
                  value={[config?.processing?.filters?.minQualityScore ?? 0.5]}
                  onValueChange={([value]) =>
                    setConfig({
                      ...config,
                      processing: {
                        ...(config.processing || { analysis: {} }),
                        filters: {
                          ...(config.processing?.filters || {}),
                          minQualityScore: value,
                        },
                      },
                    })
                  }
                  min={0}
                  max={1}
                  step={0.1}
                />
                <p className="text-sm text-muted-foreground">
                  {config?.processing?.filters?.minQualityScore ?? 0.5}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Recency Filter (days)</Label>
                <Input
                  type="number"
                  value={config?.processing?.filters?.recencyFilter ?? 30}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      processing: {
                        ...(config.processing || { analysis: {} }),
                        filters: {
                          ...(config.processing?.filters || {}),
                          recencyFilter: parseInt(e.target.value),
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* Output Tab */}
          <TabsContent value="output" className="space-y-4 mt-4">
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">Report Routing</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Send to Ruthless Judge</Label>
                  <p className="text-sm text-muted-foreground">
                    Validate report before Council
                  </p>
                </div>
                <Switch
                  checked={config?.output?.routing?.sendToRuthlessJudge ?? false}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      output: {
                        ...(config.output || { format: {}, sections: {}, storage: {} }),
                        routing: {
                          ...(config.output?.routing || { ruthlessJudgeMode: 'balanced', sendToCouncil: false, notifyOnComplete: false, notifyOnError: false }),
                          sendToRuthlessJudge: checked,
                        },
                      },
                    })
                  }
                />
              </div>

              {config?.output?.routing?.sendToRuthlessJudge && (
                <div className="space-y-2 pl-4">
                  <Label>Ruthless Judge Mode</Label>
                  <Select
                    value={config.output.routing.ruthlessJudgeMode || 'balanced'}
                    onValueChange={(value: 'quick' | 'balanced' | 'deep') =>
                      setConfig({
                        ...config,
                        output: {
                          ...config.output,
                          routing: {
                            ...config.output.routing,
                            ruthlessJudgeMode: value,
                          },
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quick">⚡ Quick</SelectItem>
                      <SelectItem value="balanced">⚖️ Balanced</SelectItem>
                      <SelectItem value="deep">🔍 Deep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label>Send to Council</Label>
                  <p className="text-sm text-muted-foreground">
                    Expert analysis after validation
                  </p>
                </div>
                <Switch
                  checked={config?.output?.routing?.sendToCouncil ?? false}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      output: {
                        ...(config.output || { format: {}, sections: {}, storage: {} }),
                        routing: {
                          ...(config.output?.routing || { sendToRuthlessJudge: false, ruthlessJudgeMode: 'balanced', notifyOnComplete: false, notifyOnError: false }),
                          sendToCouncil: checked,
                        },
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">Storage</h4>
              
              <div className="flex items-center justify-between">
                <Label>Save to Database</Label>
                <Switch
                  checked={config?.output?.storage?.saveToIndexedDB ?? true}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      output: {
                        ...(config.output || { format: {}, sections: {}, routing: {} }),
                        storage: {
                          ...(config.output?.storage || { exportToJSON: false, retentionDays: 30 }),
                          saveToIndexedDB: checked,
                        },
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Retention (days)</Label>
                <Input
                  type="number"
                  value={config?.output?.storage?.retentionDays ?? 30}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      output: {
                        ...(config.output || { format: {}, sections: {}, routing: {} }),
                        storage: {
                          ...(config.output?.storage || { saveToIndexedDB: true, exportToJSON: false }),
                          retentionDays: parseInt(e.target.value),
                        },
                      },
                    })
                  }
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
