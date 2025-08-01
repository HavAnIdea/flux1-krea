import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { GenerationResult, GenerationErrorType } from "@/types/blocks/image-generator";

interface RunwareImageRequest {
  taskType: "imageInference";
  taskUUID: string;
  model: string;
  numberResults: number;
  outputFormat: "PNG" | "JPG";
  width: number;
  height: number;
  steps: number;
  CFGScale: number;
  scheduler: string;
  includeCost: boolean;
  outputType: string[];
  positivePrompt: string;
}

interface RunwareTaskResponse {
  taskType: string;
  taskUUID: string;
  error?: {
    code: string;
    message: string;
  };
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

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({
        success: false,
        error: {
          type: GenerationErrorType.VALIDATION_ERROR,
          message: "Prompt is required and must be a non-empty string",
          retryable: false
        }
      } as GenerationResult, { status: 400 });
    }

    const apiKey = process.env.RUNWARE_API_KEY;
    if (!apiKey) {
      console.error("RUNWARE_API_KEY is not set in environment variables");
      return NextResponse.json({
        success: false,
        error: {
          type: GenerationErrorType.API_ERROR,
          message: "Image generation service is not configured",
          retryable: false
        }
      } as GenerationResult, { status: 500 });
    }

    const taskUUID = randomUUID();
    
    const requestBody: RunwareImageRequest[] = [{
      taskType: "imageInference",
      taskUUID: taskUUID,
      model: "runware:107@1",
      numberResults: 1,
      outputFormat: "PNG",
      width: 512,  // 减小尺寸以提高加载速度
      height: 512, // 减小尺寸以提高加载速度
      steps: 20,   // 减少步数以提高生成速度
      CFGScale: 3.5,
      scheduler: "Default",
      includeCost: true,
      outputType: ["URL"],
      positivePrompt: prompt.trim()
    }];

    const response = await fetch("https://api.runware.ai/v1", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Runware API error:", response.status, errorText);
      console.error("Request body was:", JSON.stringify(requestBody, null, 2));
      
      if (response.status === 401) {
        return NextResponse.json({
          success: false,
          error: {
            type: GenerationErrorType.API_ERROR,
            message: "Invalid API key. Please check your Runware API configuration.",
            retryable: false
          }
        } as GenerationResult, { status: 401 });
      }

      if (response.status === 429) {
        return NextResponse.json({
          success: false,
          error: {
            type: GenerationErrorType.LIMIT_EXCEEDED,
            message: "Rate limit exceeded. Please wait a moment before trying again.",
            retryable: true
          }
        } as GenerationResult, { status: 429 });
      }

      return NextResponse.json({
        success: false,
        error: {
          type: GenerationErrorType.API_ERROR,
          message: `API request failed with status ${response.status}`,
          retryable: response.status >= 500
        }
      } as GenerationResult, { status: response.status });
    }

    const responseData = await response.json();
    
    if (!responseData || !responseData.data || responseData.data.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          type: GenerationErrorType.GENERATION_FAILED,
          message: "No image data received from API",
          retryable: true
        }
      } as GenerationResult, { status: 500 });
    }

    // Check for errors in the response
    if (responseData.errors && responseData.errors.length > 0) {
      const error = responseData.errors[0];
      return NextResponse.json({
        success: false,
        error: {
          type: GenerationErrorType.GENERATION_FAILED,
          message: error.message || "Image generation failed",
          retryable: true
        }
      } as GenerationResult, { status: 500 });
    }

    const result = responseData.data[0];

    if (!result.imageURL) {
      return NextResponse.json({
        success: false,
        error: {
          type: GenerationErrorType.GENERATION_FAILED,
          message: "No image URL received from API",
          retryable: true
        }
      } as GenerationResult, { status: 500 });
    }

    // 从完整URL中提取图片路径，隐藏真实的API平台域名
    const imageUrl = new URL(result.imageURL);
    const imagePath = imageUrl.pathname; // 例如: /image/ws/2/ii/41c9881e-3bd7-4e8e-8b9b-a925a3a974c6.png
    
    const proxyUrl = `/api/proxy-image?path=${encodeURIComponent(imagePath)}`;

    return NextResponse.json({
      success: true,
      imageUrl: proxyUrl
    } as GenerationResult);

  } catch (error) {
    console.error("Image generation API error:", error);
    
    return NextResponse.json({
      success: false,
      error: {
        type: GenerationErrorType.GENERATION_FAILED,
        message: "An unexpected error occurred during image generation",
        retryable: true
      }
    } as GenerationResult, { status: 500 });
  }
}