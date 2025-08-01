import { Section } from "./section";

// Error handling enums and interfaces
export enum GenerationErrorType {
  NETWORK_ERROR = 'network_error',
  API_ERROR = 'api_error',
  LIMIT_EXCEEDED = 'limit_exceeded',
  GENERATION_FAILED = 'generation_failed',
  VALIDATION_ERROR = 'validation_error'
}

export interface GenerationError {
  type: GenerationErrorType;
  message: string;
  retryable: boolean;
  upgradeRequired?: boolean;
}

// Core interfaces
export interface ExampleImage {
  id: string;
  src: string;
  alt: string;
  prompt: string;
}

export interface UserLimits {
  isAuthenticated: boolean;
  isPaid: boolean;
  dailyLimit: number;
  remainingGenerations: number;
  hasSpeedLimit: boolean;
  estimatedWaitTime?: number;
}

export interface GenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: GenerationError;
  remainingGenerations?: number;
}

// Image generator configuration interfaces
export interface ImageGeneratorBrand {
  title: string;
  icon: string;
}

export interface ImageGeneratorInput {
  placeholder: string;
  minLength?: number;
  maxLength?: number;
}

export interface ImageGeneratorButton {
  title: string;
  icon: string;
  loadingText: string;
}

export interface ImageGeneratorLimits {
  showRemaining: boolean;
  upgradePrompt: string;
  upgradeUrl: string;
  messages: {
    limitReached: string;
    speedLimited: string;
    upgradeRequired: string;
  };
}

export interface ImageGeneratorDownload {
  buttonText: string;
  successMessage: string;
  errorMessage: string;
}

export interface ImageGeneratorErrors {
  networkError: string;
  generationFailed: string;
  retryButton: string;
  validationError: string;
}

export interface ImageGeneratorConfig {
  brand: ImageGeneratorBrand;
  title: string;
  description: string;
  input: ImageGeneratorInput;
  button: ImageGeneratorButton;
  examples: ExampleImage[];
  limits: ImageGeneratorLimits;
  download: ImageGeneratorDownload;
  errors: ImageGeneratorErrors;
}

// Main section interface extending Section
export interface ImageGeneratorSection extends Section {
  generator?: ImageGeneratorConfig;
}

// API interfaces
export interface GenerateImageRequest {
  prompt: string;
  userId?: string;
}

export interface GenerateImageResponse {
  success: boolean;
  data?: {
    imageUrl: string;
    remainingGenerations: number;
  };
  error?: {
    code: string;
    message: string;
    upgradeRequired?: boolean;
  };
}

// Component state interfaces
export interface GeneratorState {
  // Input state
  prompt: string;
  
  // Generation state
  isGenerating: boolean;
  generatedImage: string | null;
  error: GenerationError | null;
  
  // User limits state
  userLimits: UserLimits;
  remainingGenerations: number;
  
  // UI state
  isScrollPaused: boolean;
}

// Validation interfaces
export interface PromptValidation {
  minLength: number;
  maxLength: number;
  allowedCharacters: RegExp;
  blockedWords: string[];
}

// API service interface
export interface ImageGenerationAPI {
  generateImage(prompt: string): Promise<GenerationResult>;
  getUserLimits(): Promise<UserLimits>;
  downloadImage(imageUrl: string): Promise<Blob>;
}