import { GenerationResult, GenerationErrorType } from "@/types/blocks/image-generator";

interface RunwareImageRequest {
  taskType: "imageInference";
  model: string;
  numberResults: number;
  outputFormat: "PNG" | "JPG";
  width: number;
  height: number;
  imageSize: string;
  steps: number;
  CFGScale: number;
  scheduler: string;
  includeCost: boolean;
  outputType: string[];
  positivePrompt: string;
}

interface RunwareImageResponse {
  taskType: string;
  taskUUID: string;
  imageURL?: string;
  imageUUID?: string;
  cost?: number;
  error?: {
    code: string;
    message: string;
  };
}

export class RunwareAPI {
  private apiKey: string;
  private baseUrl = "https://api.runware.ai/v1";

  constructor() {
    this.apiKey = process.env.RUNWARE_API_KEY || "";
    if (!this.apiKey) {
      console.warn("RUNWARE_API_KEY is not set in environment variables");
    }
  }

  async generateImage(prompt: string): Promise<GenerationResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: {
          type: GenerationErrorType.API_ERROR,
          message: "API key not configured. Please check your environment settings.",
          retryable: false
        }
      };
    }

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

    const requestBody: RunwareImageRequest[] = [{
      taskType: "imageInference",
      model: "runware:107@1",
      numberResults: 1,
      outputFormat: "PNG",
      width: 1024,
      height: 1024,
      imageSize: "1:1_(1024x1024)+Square",
      steps: 28,
      CFGScale: 3.5,
      scheduler: "Default",
      includeCost: true,
      outputType: ["URL"],
      positivePrompt: prompt.trim()
    }];

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Runware API error:", response.status, errorText);
        
        if (response.status === 401) {
          return {
            success: false,
            error: {
              type: GenerationErrorType.API_ERROR,
              message: "Invalid API key. Please check your Runware API configuration.",
              retryable: false
            }
          };
        }

        if (response.status === 429) {
          return {
            success: false,
            error: {
              type: GenerationErrorType.LIMIT_EXCEEDED,
              message: "Rate limit exceeded. Please wait a moment before trying again.",
              retryable: true
            }
          };
        }

        return {
          success: false,
          error: {
            type: GenerationErrorType.API_ERROR,
            message: `API request failed with status ${response.status}`,
            retryable: response.status >= 500
          }
        };
      }

      const data: RunwareImageResponse[] = await response.json();
      
      if (!data || data.length === 0) {
        return {
          success: false,
          error: {
            type: GenerationErrorType.GENERATION_FAILED,
            message: "No image data received from API",
            retryable: true
          }
        };
      }

      const result = data[0];

      if (result.error) {
        return {
          success: false,
          error: {
            type: GenerationErrorType.GENERATION_FAILED,
            message: result.error.message || "Image generation failed",
            retryable: true
          }
        };
      }

      if (!result.imageURL) {
        return {
          success: false,
          error: {
            type: GenerationErrorType.GENERATION_FAILED,
            message: "No image URL received from API",
            retryable: true
          }
        };
      }

      return {
        success: true,
        imageUrl: result.imageURL
      };

    } catch (error) {
      console.error("Runware API request failed:", error);
      
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

  async downloadImage(imageUrl: string): Promise<Blob> {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    return response.blob();
  }
}

// Export singleton instance
export const runwareAPI = new RunwareAPI();