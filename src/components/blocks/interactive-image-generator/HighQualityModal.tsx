"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/contexts/app";
import { useRouter } from "next/navigation";

interface HighQualityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HighQualityModal({ open, onOpenChange }: HighQualityModalProps) {
  const { setShowSignModal } = useAppContext();
  const router = useRouter();

  const handleUpgrade = () => {
    onOpenChange(false);
    router.push("/#pricing");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0">
        <div className="flex flex-col">
          {/* Header */}
          <div className="p-6 border-b">
            <DialogTitle className="text-3xl font-bold tracking-tight">
              Pro Member Feature
            </DialogTitle>
            <DialogDescription className="text-base mt-3 leading-relaxed">
              High quality image generation produces more detailed images with better clarity.
            </DialogDescription>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Benefits box */}
            <div className="bg-muted/30 rounded-xl p-6 mb-6 border">
              <h3 className="text-xl font-semibold mb-4 tracking-tight">High Quality Benefits:</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold text-lg">•</span>
                  <span>Significantly improved image quality and details</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold text-lg">•</span>
                  <span>Slightly longer generation time</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold text-lg">•</span>
                  <span>Exclusive for Pro members</span>
                </li>
              </ul>
            </div>

            <p className="text-muted-foreground mb-8 leading-relaxed">
              Upgrade to Pro to unlock high quality image generation with significantly improved details.
            </p>

            {/* Action buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="w-[120px] h-9 text-base shrink-0"
                onClick={() => onOpenChange(false)}
              >
                Not Now
              </Button>
              <Button
                className="flex-1 h-9 text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={handleUpgrade}
              >
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}