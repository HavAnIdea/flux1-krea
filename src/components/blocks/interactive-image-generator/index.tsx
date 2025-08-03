"use client";

import { useState, useCallback, useEffect } from "react";
import { ImageGeneratorSection, GeneratorState, GenerationError, GenerationErrorType } from "@/types/blocks/image-generator";
import { generateDeviceFingerprint } from "@/lib/fingerprint";
import { generateImageWithLimits, getUserUsageStatus } from "@/actions/image-generation";
import { UsageStatus } from "@/lib/usage-limits";
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

  // Device fingerprint state
  const [fingerprint, setFingerprint] = useState<string>('');
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);

  // Initialize device fingerprint and usage status
  useEffect(() => {
    const initializeFingerprint = async () => {
      try {
        const fp = await generateDeviceFingerprint();
        setFingerprint(fp);

        // Get initial usage status
        const status = await getUserUsageStatus(fp);
        setUsageStatus(status);

        // Update state with usage status
        setState(prev => ({
          ...prev,
          userLimits: {
            isAuthenticated: status.userType === 'authenticated',
            isPaid: status.plan === 'paid',
            dailyLimit: status.dailyLimit,
            remainingGenerations: status.remainingCount,
            hasSpeedLimit: false
          },
          remainingGenerations: status.remainingCount
        }));
      } catch (error) {
        console.error('Failed to initialize fingerprint:', error);
        // Set fallback values
        setUsageStatus({
          userType: 'anonymous',
          remainingCount: 0,
          dailyLimit: 5,
          canUse: false,
        });
      }
    };

    initializeFingerprint();
  }, []);

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

    // Check if fingerprint is available
    if (!fingerprint) {
      setState(prev => ({
        ...prev,
        error: {
          type: GenerationErrorType.VALIDATION_ERROR,
          message: "Device fingerprint not available. Please refresh the page.",
          retryable: true
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
      // Call the new Server Action with usage limits
      const result = await generateImageWithLimits(state.prompt.trim(), fingerprint);

      if (result.success && result.imageUrl) {
        // Update usage status if provided
        if (result.usageStatus) {
          setUsageStatus(result.usageStatus);
        }

        setState(prev => ({
          ...prev,
          isGenerating: false,
          generatedImage: result.imageUrl!,
          remainingGenerations: result.usageStatus?.remainingCount || prev.remainingGenerations,
          userLimits: {
            isAuthenticated: result.usageStatus?.userType === 'authenticated' || prev.userLimits.isAuthenticated,
            isPaid: result.usageStatus?.plan === 'paid' || prev.userLimits.isPaid,
            dailyLimit: result.usageStatus?.dailyLimit || prev.userLimits.dailyLimit,
            remainingGenerations: result.usageStatus?.remainingCount || prev.userLimits.remainingGenerations,
            hasSpeedLimit: false
          }
        }));
      } else {
        // Update usage status even on failure if provided
        if (result.usageStatus) {
          setUsageStatus(result.usageStatus);
          setState(prev => ({
            ...prev,
            remainingGenerations: result.usageStatus?.remainingCount || prev.remainingGenerations,
            userLimits: {
              ...prev.userLimits,
              remainingGenerations: result.usageStatus?.remainingCount || prev.userLimits.remainingGenerations,
            }
          }));
        }

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
  }, [state.prompt, fingerprint, generator]);

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

  // Handle download - placeholder function (actual download is handled by DownloadButton)
  const handleDownload = useCallback(async () => {
    // This function is called by DownloadButton after successful download
    // Can be used for analytics or other post-download actions
    console.log('Image downloaded successfully');
  }, []);

  return (
    <section id={section.name} className="pt-20 pb-16 bg-gradient-to-br from-background via-muted/10 to-primary/5">
      <div className="container max-w-7xl mx-auto">
        {/* Hero Header Section - Full Width */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {generator.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-none mx-auto leading-relaxed">
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
              usageStatus={usageStatus}
              onPromptChange={handlePromptChange}
              onGenerate={handleGenerate}
              onRetry={handleRetry}
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
        <section className="py-4">
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-center text-2xl font-semibold lg:text-3xl">
              Try These Examples
            </h2>
          </div>
          <div className="lg:container">
            <ExampleScrollArea
              examples={generator.examples}
              onExampleClick={handleExampleClick}
              onScrollPause={handleScrollPause}
              isPaused={state.isScrollPaused}
            />
          </div>
        </section>
      </div>
    </section>
  );
}