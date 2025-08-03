"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ImageGeneratorConfig, GeneratorState } from "@/types/blocks/image-generator";
import { UsageStatus as UsageStatusType } from "@/lib/usage-limits";
import UsageStatus from "./UsageStatus";
import ErrorDisplay from "./ErrorDisplay";
import { RiMagicLine, RiLoader4Line } from "react-icons/ri";

interface LeftPanelProps {
  config: ImageGeneratorConfig;
  state: GeneratorState;
  usageStatus: UsageStatusType | null;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
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
  const isGenerateDisabled =
    state.isGenerating ||
    !state.prompt.trim() ||
    state.prompt.length < (config.input.minLength || 3) ||
    state.prompt.length > (config.input.maxLength || 500) ||
    (usageStatus ? !usageStatus.canUse : false);

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
          </div>

          {/* Generate Button */}
          <Button
            onClick={onGenerate}
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
    </div>
  );
}