"use client";

import { useState } from "react";
import { ExampleImage } from "@/types/blocks/image-generator";
import { Button } from "@/components/ui/button";
import { RiAddLine } from "react-icons/ri";

interface ExampleImageItemProps {
  example: ExampleImage;
  onClick: () => void;
}

export default function ExampleImageItem({ example, onClick }: ExampleImageItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      className="relative group cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted transition-transform duration-200 group-hover:scale-105">
        {/* Loading Placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20 animate-pulse" />
        )}
        
        {/* Example Image */}
        <img
          src={example.src}
          alt={example.alt}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)} // Show placeholder even on error
        />

        {/* Hover Overlay */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white text-black"
          >
            <RiAddLine className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-20">
          <div className="bg-popover text-popover-foreground text-xs rounded-md px-2 py-1 shadow-md border max-w-48 text-center">
            <p className="font-medium truncate">{example.prompt}</p>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover" />
          </div>
        </div>
      )}
    </div>
  );
}