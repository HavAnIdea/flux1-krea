"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ImageGeneratorConfig, GeneratorState } from "@/types/blocks/image-generator";
import UsageLimits from "./UsageLimits";
import { RiMagicLine, RiLoader4Line } from "react-icons/ri";

interface LeftPanelProps {
  config: ImageGeneratorConfig;
  state: GeneratorState;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onExampleClick: (prompt: string) => void;
  onScrollPause: (isPaused: boolean) => void;
}

export default function LeftPanel({
  config,
  state,
  onPromptChange,
  onGenerate,
  onExampleClick,
  onScrollPause
}: LeftPanelProps) {
  const isGenerateDisabled =
    state.isGenerating ||
    !state.prompt.trim() ||
    state.prompt.length < (config.input.minLength || 3) ||
    state.prompt.length > (config.input.maxLength || 500) ||
    state.remainingGenerations <= 0;

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
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{state.error.message}</p>
              {state.error.retryable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGenerate}
                  className="mt-2"
                >
                  {config.errors.retryButton}
                </Button>
              )}
              {state.error.upgradeRequired && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="mt-2 ml-2"
                >
                  <a href={config.limits.upgradeUrl} target="_blank" rel="noopener noreferrer">
                    Upgrade Now
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Limits - Compact */}
      <div className="flex-shrink-0">
        <UsageLimits
          config={config}
          userLimits={state.userLimits}
          remainingGenerations={state.remainingGenerations}
        />
      </div>
    </div>
  );
}