"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="space-y-6">
      {/* Main Display Area */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative aspect-square bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Loading State */}
            {state.isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                  <RiLoader4Line className="w-12 h-12 text-primary animate-spin" />
                  <div className="text-center space-y-2">
                    <p className="text-white font-medium">Generating your image...</p>
                    <p className="text-white/70 text-sm">This may take a few moments</p>
                  </div>
                  {/* Loading Progress Animation */}
                  <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full animate-pulse" style={{
                      animation: 'loading-progress 3s ease-in-out infinite'
                    }} />
                  </div>
                </div>
              </div>
            )}

            {/* Generated Image */}
            {state.generatedImage && !state.isGenerating && (
              <div className="relative w-full h-full">
                <img
                  src={state.generatedImage}
                  alt="Generated image"
                  className="w-full h-full object-cover"
                />
                {/* Overlay for download button */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-end justify-end p-4">
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
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                    <RiImageLine className="w-8 h-8 text-destructive" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-white font-medium">Generation Failed</p>
                    <p className="text-white/70 text-sm max-w-sm">
                      {state.error.message}
                    </p>
                  </div>
                  {state.error.retryable && (
                    <Button
                      onClick={onRetry}
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
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
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                    <RiImageLine className="w-10 h-10 text-white/60" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-white font-medium">Ready to Generate</p>
                    <p className="text-white/70 text-sm max-w-sm">
                      Enter a prompt and click generate to create your AI image
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Info */}
      {state.generatedImage && !state.isGenerating && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h6 className="font-medium">Generated Image</h6>
                <span className="text-xs text-muted-foreground">
                  Just now
                </span>
              </div>

              {/* Prompt Display */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Prompt
                </p>
                <p className="text-sm bg-muted/50 rounded-md p-2">
                  {state.prompt}
                </p>
              </div>

              {/* Image Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Format</p>
                  <p className="font-medium">PNG</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quality</p>
                  <p className="font-medium">High</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}