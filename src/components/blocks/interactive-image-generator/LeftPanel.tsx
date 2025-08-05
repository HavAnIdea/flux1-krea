"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageGeneratorConfig, GeneratorState } from "@/types/blocks/image-generator";
import { UsageStatus as UsageStatusType } from "@/lib/usage-limits";
import UsageStatus from "./UsageStatus";
import ErrorDisplay from "./ErrorDisplay";
import HighQualityModal from "./HighQualityModal";
import { RiMagicLine, RiLoader4Line } from "react-icons/ri";
import { useState } from "react";
import { useAppContext } from "@/contexts/app";

interface LeftPanelProps {
  config: ImageGeneratorConfig;
  state: GeneratorState;
  usageStatus: UsageStatusType | null;
  onPromptChange: (prompt: string) => void;
  onGenerate: (highQuality?: boolean) => void;
  onRetry: () => void;
  onExampleClick: (prompt: string) => void;
  onScrollPause: (isPaused: boolean) => void;
}

export default function LeftPanel({
  config,
  state,
  usageStatus,
  onPromptChange,
  onGenerate,
  onRetry,
  onExampleClick,
  onScrollPause
}: LeftPanelProps) {
  const { user } = useAppContext();
  const [highQuality, setHighQuality] = useState(false);
  const [showHighQualityModal, setShowHighQualityModal] = useState(false);
  
  // Check if user is paid
  const isPaidUser = user?.plan === 'paid' && user?.subscription?.isActive;

  const isGenerateDisabled =
    state.isGenerating ||
    !state.prompt.trim() ||
    state.prompt.length < (config.input.minLength || 3) ||
    state.prompt.length > (config.input.maxLength || 500) ||
    (usageStatus ? !usageStatus.canUse : false);

  // Handle high quality toggle
  const handleHighQualityChange = (checked: boolean) => {
    if (checked && !isPaidUser) {
      setShowHighQualityModal(true);
      return;
    }
    setHighQuality(checked);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Input Section - Expanded */}
      <Card className="flex-1">
        <CardContent className="p-6 h-full flex flex-col space-y-4">
          {/* Prompt Input */}
          <div className="space-y-4 flex-1">
            <label htmlFor="prompt-input" className="text-base font-medium block mb-10">
              Describe your image
            </label>
            <Textarea
              id="prompt-input"
              placeholder={config.input.placeholder}
              value={state.prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              className="min-h-[180px] resize-none text-base"
              disabled={state.isGenerating}
            />

            {/* Character Count */}
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>
                {state.prompt.length}/{config.input.maxLength || 500} characters
              </span>
              {state.prompt.length < (config.input.minLength || 3) && state.prompt.length > 0 && (
                <span className="text-destructive">
                  Minimum {config.input.minLength || 3} characters required
                </span>
              )}
              {state.prompt.length > (config.input.maxLength || 500) && (
                <span className="text-destructive">
                  Maximum {config.input.maxLength || 500} characters allowed
                </span>
              )}
            </div>

            {/* High Quality Toggle */}
            <div className="flex items-center space-x-3 pt-2 border-t">
              <Switch
                id="high-quality"
                checked={highQuality}
                onCheckedChange={handleHighQualityChange}
                disabled={!isPaidUser}
              />
              <div className="space-y-0.5">
                <Label 
                  htmlFor="high-quality" 
                  className={`text-sm font-medium cursor-pointer ${!isPaidUser ? 'cursor-pointer' : ''}`}
                  onClick={() => !isPaidUser && setShowHighQualityModal(true)}
                >
                  High Quality
                </Label>
              </div>
              {!isPaidUser && (
                <div className="ml-auto">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => setShowHighQualityModal(true)}>
                    PRO
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={() => onGenerate(highQuality)}
            disabled={isGenerateDisabled}
            className="w-full"
            size="lg"
          >
            {state.isGenerating ? (
              <>
                <RiLoader4Line className="w-4 h-4 mr-2 animate-spin" />
                {config.button.loadingText}
              </>
            ) : (
              <>
                <RiMagicLine className="w-4 h-4 mr-2" />
                {config.button.title}
              </>
            )}
          </Button>

          {/* Error Display */}
          {state.error && (
            <ErrorDisplay
              error={state.error}
              onRetry={onRetry}
            />
          )}
        </CardContent>
      </Card>

      {/* Usage Status - Compact */}
      <div className="flex-shrink-0">
        <UsageStatus usageStatus={usageStatus} />
      </div>
      {/* High Quality Modal */}
      <HighQualityModal
        open={showHighQualityModal}
        onOpenChange={setShowHighQualityModal}
      />
    </div>
  );
}