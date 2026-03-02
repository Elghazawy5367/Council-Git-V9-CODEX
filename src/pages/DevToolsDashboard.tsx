import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import {
  Code2,
  FlaskConical,
  GitCompare,
  Search,
  Cpu,
  Wrench
} from "lucide-react";

// FINAL: Dev Tools dashboard — shell page for /dev-tools route
// Provides entry points to Mirror, Learn, Twin, HEIST, and Scout tools

interface DevTool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'available' | 'coming-soon';
}

const TOOLS: DevTool[] = [
  {
    id: 'mirror',
    name: 'Code Mirror',
    description: 'Analyze code quality against elite repository standards',
    icon: <Code2 className="h-5 w-5" />,
    status: 'available',
  },
  {
    id: 'learn',
    name: 'Learn',
    description: 'Extract patterns from successful repositories',
    icon: <FlaskConical className="h-5 w-5" />,
    status: 'available',
  },
  {
    id: 'twin',
    name: 'Twin',
    description: 'Compare your project against similar repos',
    icon: <GitCompare className="h-5 w-5" />,
    status: 'available',
  },
  {
    id: 'heist',
    name: 'HEIST',
    description: 'Browse and inject expert prompts from the community',
    icon: <Search className="h-5 w-5" />,
    status: 'available',
  },
  {
    id: 'scout',
    name: 'Scout',
    description: 'GitHub intelligence extraction for market research',
    icon: <Cpu className="h-5 w-5" />,
    status: 'coming-soon',
  },
];

const DevToolsDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wrench className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Dev Tools</h1>
          <p className="text-sm text-muted-foreground">
            Intelligence and quality analysis tools
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <Card key={tool.id} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                {tool.icon}
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">{tool.name}</CardTitle>
                <CardDescription className="text-xs">
                  {tool.description}
                </CardDescription>
              </div>
              <Badge variant={tool.status === 'available' ? 'default' : 'secondary'}>
                {tool.status === 'available' ? 'Ready' : 'Soon'}
              </Badge>
            </CardHeader>
            <CardContent>
              <Button
                variant={tool.status === 'available' ? 'default' : 'outline'}
                size="sm"
                className="w-full"
                disabled={tool.status === 'coming-soon'}
              >
                {tool.status === 'available' ? 'Open Tool' : 'Coming Soon'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DevToolsDashboard;
