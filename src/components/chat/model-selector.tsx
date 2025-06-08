'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AVAILABLE_MODELS = [
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Most capable model',
    icon: '🤖',
    badge: 'Smart'
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Fast and efficient',
    icon: '⚡',
    badge: 'Fast'
  },
  {
    id: 'anthropic/claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Reasoning expert',
    icon: '🧠',
    badge: 'Analytical'
  },
  {
    id: 'google/gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: 'Multimodal AI',
    icon: '💎',
    badge: 'Multimodal'
  },
];

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel);

  return (
    <Select value={selectedModel} onValueChange={onModelChange}>
      <SelectTrigger className="w-72">
        <SelectValue>
          <div className="flex items-center gap-2">
            <span>{currentModel?.icon}</span>
            <span className="font-medium">{currentModel?.name}</span>
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              {currentModel?.badge}
            </span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {AVAILABLE_MODELS.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <div className="flex items-center gap-3 py-1">
              <span className="text-lg">{model.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                    {model.badge}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {model.description}
                </div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
