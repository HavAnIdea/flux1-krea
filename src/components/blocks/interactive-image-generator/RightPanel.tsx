"use client";

import { Button } from "@/components/ui/button";
import { ImageGeneratorConfig, GeneratorState } from "@/types/blocks/image-generator";
import DownloadButton from "./DownloadButton";
import { RiImageLine, RiLoader4Line, RiRefreshLine } from "react-icons/ri";

interface RightPanelProps {
  config: ImageGeneratorConfig;
  state: GeneratorState;
  onRetry: () => void;
  onDownload: () => void;
}

export default function RightPanel({
  config,
  state,
  onRetry,
  onDownload
}: RightPanelProps) {
  return (
    <div className="h-full flex items-stretch">
      {/* Main Display Area - Full Height */}
      <div className="relative aspect-square w-full h-full min-h-[400px]">
        {/* Loading State */}
        {state.isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-muted/20 to-muted/10 rounded-2xl backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-4">
              <RiLoader4Line className="w-12 h-12 text-primary animate-spin" />
              <div className="text-center space-y-2">
                <p className="text-foreground font-medium">Generating your image...</p>
                <p className="text-muted-foreground text-sm">This may take a few moments</p>
              </div>
              {/* Loading Progress Animation */}
              <div className="w-48 h-1 bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{
                  animation: 'loading-progress 3s ease-in-out infinite'
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Generated Image */}
        {state.generatedImage && !state.isGenerating && (
          <div className="relative w-full h-full group">
            <img
              src={state.generatedImage}
              alt="Generated image"
              className="w-full h-full object-cover rounded-2xl shadow-2xl"
            />
            {/* Overlay for download button */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-end justify-end p-4 rounded-2xl">
              <DownloadButton
                config={config}
                imageUrl={state.generatedImage}
                onDownload={onDownload}
              />
            </div>
          </div>
        )}

        {/* Error State */}
        {state.error && !state.isGenerating && !state.generatedImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-muted/10 to-muted/5 rounded-2xl backdrop-blur-sm">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <RiImageLine className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <p className="text-foreground font-medium">Generation Failed</p>
                <p className="text-muted-foreground text-sm max-w-sm">
                  {state.error.message}
                </p>
              </div>
              {state.error.retryable && (
                <Button
                  onClick={onRetry}
                  variant="outline"
                  className="bg-background/50 backdrop-blur-sm"
                >
                  <RiRefreshLine className="w-4 h-4 mr-2" />
                  {config.errors.retryButton}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!state.isGenerating && !state.generatedImage && !state.error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-muted/10 to-muted/5 rounded-2xl backdrop-blur-sm border-2 border-dashed border-muted/30">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center">
                <RiImageLine className="w-10 h-10 text-muted-foreground/60" />
              </div>
              <div className="space-y-2">
                <p className="text-foreground font-medium">Ready to Generate</p>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Enter a prompt and click generate to create your AI image
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}