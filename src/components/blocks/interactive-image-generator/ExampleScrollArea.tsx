"use client";

import { useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import AutoScroll from "embla-carousel-auto-scroll";
import { ExampleImage } from "@/types/blocks/image-generator";
import ExampleImageItem from "./ExampleImageItem";

interface ExampleScrollAreaProps {
  examples: ExampleImage[];
  onExampleClick: (prompt: string) => void;
  onScrollPause: (isPaused: boolean) => void;
  isPaused: boolean;
}

export default function ExampleScrollArea({
  examples,
  onExampleClick,
  onScrollPause,
  isPaused
}: ExampleScrollAreaProps) {
  const plugin = useRef(
    AutoScroll({
      startDelay: 1000,
      speed: 0.5,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      stopOnFocusIn: false
    })
  );

  const handleMouseEnter = () => {
    plugin.current.stop();
    onScrollPause(true);
  };

  const handleMouseLeave = () => {
    plugin.current.play();
    onScrollPause(false);
  };

  return (
    <div className="relative">
      <Carousel
        opts={{
          loop: true,
          align: "start",
          dragFree: true
        }}
        plugins={[plugin.current]}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative before:absolute before:bottom-0 before:left-0 before:top-0 before:z-10 before:w-8 before:bg-gradient-to-r before:from-background before:to-transparent after:absolute after:bottom-0 after:right-0 after:top-0 after:z-10 after:w-8 after:bg-gradient-to-l after:from-background after:to-transparent"
      >
        <CarouselContent className="-ml-2">
          {examples.map((example) => (
            <CarouselItem key={example.id} className="basis-auto pl-2">
              <ExampleImageItem
                example={example}
                onClick={() => onExampleClick(example.prompt)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}