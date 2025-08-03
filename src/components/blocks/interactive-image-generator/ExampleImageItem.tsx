"use client";

import { useState } from "react";
import { ExampleImage } from "@/types/blocks/image-generator";
import { Button } from "@/components/ui/button";
import { RiAddLine, RiImageLine } from "react-icons/ri";

interface ExampleImageItemProps {
  example: ExampleImage;
  onClick: () => void;
}

export default function ExampleImageItem({ example, onClick }: ExampleImageItemProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="select-none cursor-pointer transition-all duration-200 hover:scale-[1.05] group"
      onClick={onClick}
    >
      {/* Image Container - 1:1 aspect ratio, larger size */}
      <div className="relative w-56 h-56 rounded-xl overflow-hidden bg-muted shadow-lg">
        {/* Example Image */}
        <img
          src={example.src}
          alt={example.alt}
          className={`w-full h-full object-cover transition-all duration-200 ${imageLoaded && !imageError ? 'opacity-100' : 'opacity-0'
            } group-hover:scale-110`}
          onLoad={() => {
            setImageLoaded(true);
            setImageError(false);
          }}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          ref={(img) => {
            // Check if image is already loaded (cached)
            if (img && img.complete && img.naturalHeight !== 0) {
              setImageLoaded(true);
              setImageError(false);
            }
          }}
        />

        {/* Loading Placeholder - only show when image hasn't loaded */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20 animate-pulse flex items-center justify-center z-10">
            <RiImageLine className="w-10 h-10 text-muted-foreground/50" />
          </div>
        )}

        {/* Error State */}
        {imageError && (
          <div className="absolute inset-0 bg-red-100 flex items-center justify-center z-10">
            <div className="text-center">
              <RiImageLine className="w-10 h-10 text-red-400 mx-auto mb-2" />
              <p className="text-xs text-red-600">Failed to load</p>
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center z-20">
          <Button
            size="sm"
            variant="secondary"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/95 hover:bg-white text-black shadow-xl border-0"
          >
            <RiAddLine className="w-4 h-4 mr-2" />
            Use
          </Button>
        </div>
      </div>
    </div>
  );
}