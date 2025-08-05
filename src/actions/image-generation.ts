'use server';

import { auth } from "@/auth";
import { GenerationResult, GenerationErrorType } from "@/types/blocks/image-generator";
import { UsageStatus, UsageLimitErrorType } from "@/lib/usage-limits";
import {
  checkAuthenticatedUserLimits,
  checkAnonymousUserLimits,
  updateAuthenticatedUserUsage,
  updateAnonymousUserUsage,
  getCurrentUsageStatus
} from "@/lib/usage-verification";
import { validatePrompt, validateFingerprint } from "@/lib/validation";
import { perf } from "@/lib/performance";

// Extended generation result with usage status
export interface GenerationWithUsageResult extends GenerationResult {
  usageStatus?: UsageStatus;
}

/**
 * Generate image with usage limits checking
 */
export async function generateImageWithLimits(
  prompt: string,
  fingerprintHash: string,
  highQuality: boolean = false
): Promise<GenerationWithUsageResult> {
  const timerId = perf.start('generateImageWithLimits');

  try {
    // Input validation and sanitization
    const promptValidation = validatePrompt(prompt);
    if (!promptValidation.isValid) {
      return {
        success: false,
        error: {
          type: GenerationErrorType.VALIDATION_ERROR,
          message: promptValidation.error || "Invalid prompt",
          retryable: false
        }
      };
    }

    const fingerprintValidation = validateFingerprint(fingerprintHash);
    if (!fingerprintValidation.isValid) {
      return {
        success: false,
        error: {
          type: GenerationErrorType.VALIDATION_ERROR,
          message: fingerprintValidation.error || "Invalid device fingerprint",
          retryable: false
        }
      };
    }

    // Use sanitized inputs
    const sanitizedPrompt = promptValidation.sanitized!;
    const sanitizedFingerprint = fingerprintValidation.sanitized!;

    // Get user session
    const session = await auth();
    const userUuid = session?.user?.uuid || null;



    // Check usage limits
    let usageCheck;
    if (userUuid) {
      usageCheck = await checkAuthenticatedUserLimits(userUuid);
    } else {
      usageCheck = await checkAnonymousUserLimits(sanitizedFingerprint);
    }

    if (!usageCheck.canUse) {
      return {
        success: false,
        error: {
          type: GenerationErrorType.LIMIT_EXCEEDED,
          message: usageCheck.error?.message || "Usage limit exceeded",
          retryable: false,
          upgradeRequired: usageCheck.error?.upgradeRequired
        },
        usageStatus: usageCheck.usageStatus
      };
    }

    // Generate image using existing API logic
    const generationResult = await callImageGenerationAPI(sanitizedPrompt, highQuality);

    if (!generationResult.success) {
      return {
        ...generationResult,
        usageStatus: usageCheck.usageStatus
      };
    }

    // Update usage count after successful generation
    let updatedUsageStatus;
    try {
      if (userUuid) {
        updatedUsageStatus = await updateAuthenticatedUserUsage(userUuid);
      } else {
        updatedUsageStatus = await updateAnonymousUserUsage(sanitizedFingerprint);
      }
    } catch (error) {
      console.error('Failed to update usage count:', error);
      // Don't fail the generation if usage update fails
      updatedUsageStatus = usageCheck.usageStatus;
    }

    return {
      ...generationResult,
      usageStatus: updatedUsageStatus
    };

  } catch (error) {
    console.error('Image generation with limits failed:', error);

    return {
      success: false,
      error: {
        type: GenerationErrorType.GENERATION_FAILED,
        message: "An unexpected error occurred during image generation",
        retryable: true
      }
    };
  } finally {
    perf.end(timerId);
  }
}

/**
 * Get current usage status without generating image
 */
export async function getUserUsageStatus(
  fingerprintHash: string
): Promise<UsageStatus> {
  const timerId = perf.start('getUserUsageStatus');

  try {
    // Validate fingerprint
    const fingerprintValidation = validateFingerprint(fingerprintHash);
    if (!fingerprintValidation.isValid) {
      // Return safe default for invalid fingerprint
      return {
        userType: 'anonymous',
        remainingCount: 0,
        dailyLimit: 5,
        canUse: false,
      };
    }

    const session = await auth();
    const userUuid = session?.user?.uuid || null;

    return await getCurrentUsageStatus(userUuid, fingerprintValidation.sanitized!);
  } catch (error) {
    console.error('Failed to get usage status:', error);

    // Return safe default
    return {
      userType: 'anonymous',
      remainingCount: 0,
      dailyLimit: 5,
      canUse: false,
    };
  } finally {
    perf.end(timerId);
  }
}

/**
 * Call the existing image generation API
 * This replicates the logic from /api/generate-image/route.ts
 */
async function callImageGenerationAPI(prompt: string, highQuality: boolean = false): Promise<GenerationResult> {
  try {
    const apiKey = process.env.RUNWARE_API_KEY;
    if (!apiKey) {
      console.error("RUNWARE_API_KEY is not set in environment variables");
      return {
        success: false,
        error: {
          type: GenerationErrorType.API_ERROR,
          message: "Image generation service is not configured",
          retryable: false
        }
      };
    }

    const taskUUID = crypto.randomUUID();

    const requestBody = [{
      taskType: "imageInference",
      taskUUID: taskUUID,
      model: "runware:107@1",
      numberResults: 1,
      outputFormat: "PNG",
      width: highQuality ? 1024 : 512,
      height: highQuality ? 1024 : 512,
      steps: highQuality ? 30 : 20,
      CFGScale: highQuality ? 7 : 3.5,
      scheduler: "Default",
      includeCost: true,
      outputType: ["URL"],
      positivePrompt: prompt
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

    const responseData = await response.json();

    if (!responseData || !responseData.data || responseData.data.length === 0) {
      return {
        success: false,
        error: {
          type: GenerationErrorType.GENERATION_FAILED,
          message: "No image data received from API",
          retryable: true
        }
      };
    }

    // Check for errors in the response
    if (responseData.errors && responseData.errors.length > 0) {
      const error = responseData.errors[0];
      return {
        success: false,
        error: {
          type: GenerationErrorType.GENERATION_FAILED,
          message: error.message || "Image generation failed",
          retryable: true
        }
      };
    }

    const result = responseData.data[0];

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

    // Extract image path and create proxy URL
    const imageUrl = new URL(result.imageURL);
    const imagePath = imageUrl.pathname;
    const proxyUrl = `/api/proxy-image?path=${encodeURIComponent(imagePath)}`;

    return {
      success: true,
      imageUrl: proxyUrl
    };

  } catch (error) {
    console.error("Image generation API error:", error);

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