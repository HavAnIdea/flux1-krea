"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageGeneratorConfig } from "@/types/blocks/image-generator";
import { RiDownloadLine, RiCheckLine, RiLoader4Line } from "react-icons/ri";

interface DownloadButtonProps {
  config: ImageGeneratorConfig;
  imageUrl: string;
  onDownload: () => void;
}

export default function DownloadButton({
  config,
  imageUrl,
  onDownload
}: DownloadButtonProps) {
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');

  const handleDownload = async () => {
    if (!imageUrl || downloadState === 'downloading') return;

    setDownloadState('downloading');

    try {
      // For mobile devices, we need to handle download differently
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Mobile download: open in new tab for user to save manually
        const link = document.createElement('a');
        link.href = imageUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Desktop download: direct download
        try {
          // 确保使用完整的URL（如果是相对路径，添加域名）
          const fullUrl = imageUrl.startsWith('/') 
            ? `${window.location.origin}${imageUrl}` 
            : imageUrl;

          // Try to fetch the image and create a blob for better download experience
          const response = await fetch(fullUrl);
          const blob = await response.blob();
          
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `generated-image-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (fetchError) {
          // Fallback to direct link download
          const fullUrl = imageUrl.startsWith('/') 
            ? `${window.location.origin}${imageUrl}` 
            : imageUrl;
          const link = document.createElement('a');
          link.href = fullUrl;
          link.download = `generated-image-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }

      // Call the parent's download handler
      onDownload();

      setDownloadState('success');
      
      // Reset state after showing success
      setTimeout(() => {
        setDownloadState('idle');
      }, 2000);

    } catch (error) {
      console.error('Download failed:', error);
      setDownloadState('error');
      
      // Reset state after showing error
      setTimeout(() => {
        setDownloadState('idle');
      }, 3000);
    }
  };

  const getButtonContent = () => {
    switch (downloadState) {
      case 'downloading':
        return (
          <>
            <RiLoader4Line className="w-4 h-4 mr-2 animate-spin" />
            Downloading...
          </>
        );
      case 'success':
        return (
          <>
            <RiCheckLine className="w-4 h-4 mr-2" />
            Downloaded!
          </>
        );
      case 'error':
        return (
          <>
            <RiDownloadLine className="w-4 h-4 mr-2" />
            Retry Download
          </>
        );
      default:
        return (
          <>
            <RiDownloadLine className="w-4 h-4 mr-2" />
            {config.download.buttonText}
          </>
        );
    }
  };

  const getButtonVariant = () => {
    switch (downloadState) {
      case 'success':
        return 'default' as const;
      case 'error':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={downloadState === 'downloading'}
      variant={getButtonVariant()}
      size="sm"
      className="shadow-lg backdrop-blur-sm bg-background/90 hover:bg-background/95"
    >
      {getButtonContent()}
    </Button>
  );
}