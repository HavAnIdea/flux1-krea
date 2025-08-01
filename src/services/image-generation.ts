import { GenerationResult, GenerationErrorType } from "@/types/blocks/image-generator";

export class ImageGenerationService {
  async generateImage(prompt: string): Promise<GenerationResult> {
    if (!prompt.trim()) {
      return {
        success: false,
        error: {
          type: GenerationErrorType.VALIDATION_ERROR,
          message: "Prompt cannot be empty",
          retryable: false
        }
      };
    }

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: prompt.trim() })
      });

      const result: GenerationResult = await response.json();
      return result;

    } catch (error) {
      console.error("Image generation request failed:", error);

      if (error instanceof TypeError && error.message.includes("fetch")) {
        return {
          success: false,
          error: {
            type: GenerationErrorType.NETWORK_ERROR,
            message: "Network connection failed. Please check your internet connection.",
            retryable: true
          }
        };
      }

      return {
        success: false,
        error: {
          type: GenerationErrorType.GENERATION_FAILED,
          message: "An unexpected error occurred during image generation",
          retryable: true
        }
      };
    }
  }

  async downloadImage(imageUrl: string, filename?: string): Promise<void> {
    try {
      // 确保使用完整的URL（如果是相对路径，添加域名）
      const fullUrl = imageUrl.startsWith('/')
        ? `${window.location.origin}${imageUrl}`
        : imageUrl;

      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const imageGenerationService = new ImageGenerationService();