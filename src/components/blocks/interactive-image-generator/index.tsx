"use client";

import { useState, useCallback } from "react";
import { ImageGeneratorSection, GeneratorState, GenerationError, GenerationErrorType } from "@/types/blocks/image-generator";
import { imageGenerationService } from "@/services/image-generation";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import ExampleScrollArea from "./ExampleScrollArea";

interface InteractiveImageGeneratorProps {
  section: ImageGeneratorSection;
}

export default function InteractiveImageGenerator({ section }: InteractiveImageGeneratorProps) {
  // Early return if section is disabled
  if (section.disabled || !section.generator) {
    return null;
  }

  const { generator } = section;

  // Initialize state
  const [state, setState] = useState<GeneratorState>({
    prompt: "",
    isGenerating: false,
    generatedImage: null,
    error: null,
    userLimits: {
      isAuthenticated: false,
      isPaid: false,
      dailyLimit: 10,
      remainingGenerations: 5,
      hasSpeedLimit: false
    },
    remainingGenerations: 5,
    isScrollPaused: false
  });

  // Handle prompt change
  const handlePromptChange = useCallback((newPrompt: string) => {
    setState(prev => ({
      ...prev,
      prompt: newPrompt,
      error: null // Clear any validation errors
    }));
  }, []);

  // Handle example image click
  const handleExampleClick = useCallback((prompt: string) => {
    setState(prev => ({
      ...prev,
      prompt,
      error: null
    }));
  }, []);

  // Handle image generation
  const handleGenerate = useCallback(async () => {
    // Validation
    if (!state.prompt.trim()) {
      setState(prev => ({
        ...prev,
        error: {
          type: GenerationErrorType.VALIDATION_ERROR,
          message: generator.errors.validationError,
          retryable: false
        }
      }));
      return;
    }

    if (state.prompt.length < (generator.input.minLength || 3)) {
      setState(prev => ({
        ...prev,
        error: {
          type: GenerationErrorType.VALIDATION_ERROR,
          message: generator.errors.validationError,
          retryable: false
        }
      }));
      return;
    }

    if (state.prompt.length > (generator.input.maxLength || 500)) {
      setState(prev => ({
        ...prev,
        error: {
          type: GenerationErrorType.VALIDATION_ERROR,
          message: generator.errors.validationError,
          retryable: false
        }
      }));
      return;
    }

    // Check user limits
    if (state.remainingGenerations <= 0) {
      setState(prev => ({
        ...prev,
        error: {
          type: GenerationErrorType.LIMIT_EXCEEDED,
          message: generator.limits.messages.limitReached,
          retryable: false,
          upgradeRequired: true
        }
      }));
      return;
    }

    // Start generation
    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
      generatedImage: null
    }));

    try {
      // Call the real Runware API
      const result = await imageGenerationService.generateImage(state.prompt);
      
      if (result.success && result.imageUrl) {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          generatedImage: result.imageUrl!,
          remainingGenerations: Math.max(0, prev.remainingGenerations - 1),
          userLimits: {
            ...prev.userLimits,
            remainingGenerations: Math.max(0, prev.userLimits.remainingGenerations - 1)
          }
        }));
      } else {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          error: result.error || {
            type: GenerationErrorType.GENERATION_FAILED,
            message: generator.errors.generationFailed,
            retryable: true
          }
        }));
      }
    } catch (error) {
      console.error("Image generation failed:", error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: {
          type: GenerationErrorType.GENERATION_FAILED,
          message: generator.errors.generationFailed,
          retryable: true
        }
      }));
    }
  }, [state.prompt, state.remainingGenerations, generator]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
    handleGenerate();
  }, [handleGenerate]);

  // Handle scroll pause
  const handleScrollPause = useCallback((isPaused: boolean) => {
    setState(prev => ({
      ...prev,
      isScrollPaused: isPaused
    }));
  }, []);

  // Handle download
  const handleDownload = useCallback(async () => {
    if (!state.generatedImage) return;

    try {
      await imageGenerationService.downloadImage(
        state.generatedImage,
        `generated-image-${Date.now()}.png`
      );
    } catch (error) {
      console.error('Download failed:', error);
      // Could add error state here if needed
    }
  }, [state.generatedImage]);

  return (
    <section id={section.name} className="pt-20 pb-16 bg-gradient-to-br from-background via-muted/10 to-primary/5">
      <div className="container max-w-7xl mx-auto">
        {/* Hero Header Section - Full Width */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {generator.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            {generator.description}
          </p>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 items-stretch">
          {/* Left Panel - Input Controls */}
          <div className="min-h-[500px]">
            <LeftPanel
              config={generator}
              state={state}
              onPromptChange={handlePromptChange}
              onGenerate={handleGenerate}
              onExampleClick={handleExampleClick}
              onScrollPause={handleScrollPause}
            />
          </div>

          {/* Right Panel - Image Display */}
          <div className="min-h-[500px]">
            <RightPanel
              config={generator}
              state={state}
              onRetry={handleRetry}
              onDownload={handleDownload}
            />
          </div>
        </div>

        {/* Example Images Section - Full Width */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <h5 className="text-lg font-medium">Try these examples</h5>
            <span className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md">
              Click to use
            </span>
          </div>
          <div className="max-w-6xl mx-auto">
            <ExampleScrollArea
              examples={generator.examples}
              onExampleClick={handleExampleClick}
              onScrollPause={handleScrollPause}
              isPaused={state.isScrollPaused}
            />
          </div>
        </div>
      </div>
    </section>
  );
}