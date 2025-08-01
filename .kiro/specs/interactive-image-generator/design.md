# 设计文档

## 概述

交互式图像生成器将替换首页的 branding 区域，提供一个完整的 AI 图像生成体验。该组件采用左右分栏布局，左侧为功能交互区，右侧为结果展示区，底部包含动态滚动的示例图片区域。设计遵循现有项目的架构模式，确保与当前代码库的无缝集成。

## 架构

### 组件层次结构

```
InteractiveImageGenerator (主组件)
├── LeftPanel (左侧功能区)
│   ├── BrandSection (品牌标识区)
│   ├── ContentSection (内容区)
│   │   ├── Title (标题)
│   │   ├── Description (描述)
│   │   ├── PromptInput (提示词输入框)
│   │   └── GenerateButton (生成按钮)
│   └── UsageLimits (使用限制显示)
├── RightPanel (右侧展示区)
│   ├── ImageDisplay (图片展示)
│   ├── LoadingState (加载状态)
│   ├── ErrorState (错误状态)
│   └── DownloadButton (下载按钮)
└── ExampleScrollArea (示例图片滚动区)
    ├── Carousel (使用 embla-carousel)
    │   ├── CarouselContent
    │   └── CarouselItem[] (示例图片项)
    └── AutoScroll Plugin (自动滚动插件)
```

### 状态管理架构

```typescript
interface GeneratorState {
  // 输入状态
  prompt: string;
  
  // 生成状态
  isGenerating: boolean;
  generatedImage: string | null;
  error: string | null;
  
  // 用户限制状态
  userLimits: UserLimits;
  remainingGenerations: number;
  
  // UI 状态
  isScrollPaused: boolean;
}
```

## 组件和接口

### 主要接口定义

```typescript
// 扩展现有的 Section 接口
export interface ImageGeneratorSection extends Section {
  generator?: {
    title: string;
    description: string;
    placeholder: string;
    brand: {
      title: string;
      icon: string;
    };
    examples: ExampleImage[];
    button: {
      title: string;
      icon: string;
      loadingText: string;
    };
    limits: {
      showRemaining: boolean;
      upgradePrompt: string;
      upgradeUrl: string;
    };
  };
}

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
  error?: string;
  remainingGenerations?: number;
}
```

### API 接口设计

```typescript
// 图像生成 API
export interface ImageGenerationAPI {
  generateImage(prompt: string): Promise<GenerationResult>;
  getUserLimits(): Promise<UserLimits>;
  downloadImage(imageUrl: string): Promise<Blob>;
}

// API 实现接口
interface GenerateImageRequest {
  prompt: string;
  userId?: string;
}

interface GenerateImageResponse {
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
```

## 数据模型

### 配置数据结构

```typescript
// 在 i18n 配置中的数据结构
interface LandingPageConfig {
  // ... 现有配置
  imageGenerator: {
    brand: {
      title: string;
      icon: string;
    };
    title: string;
    description: string;
    input: {
      placeholder: string;
    };
    button: {
      title: string;
      icon: string;
      loadingText: string;
    };
    examples: ExampleImage[];
    limits: {
      showRemaining: boolean;
      upgradePrompt: string;
      upgradeUrl: string;
      messages: {
        limitReached: string;
        speedLimited: string;
        upgradeRequired: string;
      };
    };
    download: {
      buttonText: string;
      successMessage: string;
      errorMessage: string;
    };
    errors: {
      networkError: string;
      generationFailed: string;
      retryButton: string;
    };
  };
}
```

### 示例图片数据

```typescript
const exampleImages: ExampleImage[] = [
  {
    id: "example-1",
    src: "/imgs/examples/1.jpg",
    alt: "Ethereal ghost figure",
    prompt: "A translucent ghost figure floating above an open book, ethereal lighting, dark background"
  },
  {
    id: "example-2", 
    src: "/imgs/examples/2.jpg",
    alt: "Cyberpunk cityscape",
    prompt: "Futuristic cyberpunk cityscape at night, neon lights, flying cars, detailed architecture"
  },
  // ... 更多示例
];
```

## 错误处理

### 错误类型定义

```typescript
enum GenerationErrorType {
  NETWORK_ERROR = 'network_error',
  API_ERROR = 'api_error',
  LIMIT_EXCEEDED = 'limit_exceeded',

  GENERATION_FAILED = 'generation_failed'
}

interface GenerationError {
  type: GenerationErrorType;
  message: string;
  retryable: boolean;
  upgradeRequired?: boolean;
}
```

### 错误处理策略

1. **网络错误**: 显示重试按钮，允许用户重新尝试
2. **API 错误**: 显示具体错误信息，提供技术支持联系方式
3. **限制超出**: 显示升级提示，引导用户查看定价计划
4. **生成失败**: 提供重试选项，建议修改提示词

## 测试策略

### 单元测试

```typescript
// 组件测试用例
describe('InteractiveImageGenerator', () => {
  test('renders with correct initial state', () => {});
  test('handles prompt input correctly', () => {});
  test('triggers generation on button click', () => {});
  test('displays loading state during generation', () => {});
  test('shows generated image on success', () => {});
  test('displays error message on failure', () => {});
  test('handles example image clicks', () => {});
  test('respects user limits', () => {});
});

// API 测试用例
describe('ImageGenerationAPI', () => {
  test('generates image successfully', () => {});
  test('handles API errors gracefully', () => {});
  test('respects rate limits', () => {});
  test('downloads images correctly', () => {});
});
```

### 集成测试

```typescript
// 端到端测试场景
describe('Image Generation Flow', () => {
  test('complete generation workflow for free user', () => {});
  test('limit enforcement for different user types', () => {});
  test('mobile responsive behavior', () => {});
  test('example image interaction', () => {});
  test('download functionality', () => {});
});
```

### 性能测试

1. **加载性能**: 组件初始化时间 < 100ms
2. **生成响应**: API 调用响应时间监控
3. **滚动性能**: 复用 testimonial 组件的 embla-carousel 滚动实现，确保流畅度
4. **内存使用**: 长时间使用后的内存泄漏检测

## 响应式设计

### 断点定义

```css
/* 移动端优先设计 */
.image-generator {
  /* 默认移动端样式 */
}

@media (min-width: 768px) {
  /* 平板端样式 */
  .image-generator {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  /* 桌面端样式 */
  .image-generator {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### 移动端适配策略

1. **布局调整**: 左右分栏改为上下布局
2. **输入优化**: 增大触摸目标，优化键盘体验
3. **图片展示**: 适配移动端屏幕尺寸
4. **滚动体验**: 复用现有 testimonial 组件的 embla-carousel 滚动实现
5. **下载处理**: 移动端下载行为优化

## 安全考虑

### 输入验证

```typescript
// 提示词验证规则
const promptValidation = {
  minLength: 3,
  maxLength: 500,
  allowedCharacters: /^[a-zA-Z0-9\s\.,!?-]+$/,
  blockedWords: ['inappropriate', 'content', 'list']
};

// 输入清理函数
function sanitizePrompt(prompt: string): string {
  return prompt
    .trim()
    .replace(/[<>]/g, '') // 移除潜在的 HTML 标签
    .substring(0, promptValidation.maxLength);
}
```

### API 安全

1. **速率限制**: 防止 API 滥用
2. **用户认证**: JWT token 验证
3. **输入过滤**: 服务端提示词内容过滤
4. **图片安全**: 生成内容的安全检查

## 性能优化

### 图片优化

```typescript
// 图片懒加载和优化
const imageOptimization = {
  format: 'webp', // 优先使用 WebP 格式
  quality: 85,
  sizes: {
    thumbnail: '100x100',
    display: '512x512',
    download: '1024x1024'
  }
};
```

### 缓存策略

1. **示例图片**: 浏览器缓存 + CDN
2. **生成结果**: 临时缓存，用户会话期间有效
3. **用户限制**: Redis 缓存，实时更新
4. **API 响应**: 适当的 HTTP 缓存头

### 代码分割

```typescript
// 动态导入优化
const InteractiveImageGenerator = lazy(() => 
  import('@/components/blocks/interactive-image-generator')
);

// 预加载关键资源
const preloadResources = () => {
  // 预加载示例图片
  exampleImages.forEach(img => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = img.src;
    document.head.appendChild(link);
  });
};
```

## 国际化支持

### 多语言配置结构

```typescript
// 支持的语言配置
interface I18nConfig {
  en: LandingPageConfig;
  zh: LandingPageConfig;
  // 其他语言...
}

// 动态语言切换
const useImageGeneratorI18n = (locale: string) => {
  return useMemo(() => {
    return getImageGeneratorConfig(locale);
  }, [locale]);
};
```

### 文本本地化要点

1. **提示词示例**: 不同语言的示例提示词
2. **错误消息**: 本地化的错误提示
3. **按钮文本**: 动态按钮文本
4. **限制说明**: 清晰的限制说明文本

## 监控和分析

### 关键指标

```typescript
// 业务指标追踪
interface GeneratorMetrics {
  totalGenerations: number;
  successRate: number;
  averageGenerationTime: number;
  userConversionRate: number; // 免费用户转付费用户比率
  popularPrompts: string[];
  errorDistribution: Record<GenerationErrorType, number>;
}
```

### 用户行为分析

1. **使用模式**: 生成频率、时间分布
2. **提示词分析**: 热门提示词、成功率
3. **转化漏斗**: 访问 → 尝试 → 成功 → 升级
4. **错误追踪**: 错误类型、频率、用户影响

## 示例图片滚动实现

### 技术方案

基于现有 testimonial 组件的滚动实现，使用相同的技术栈：

```typescript
// 复用 testimonial 组件的滚动技术
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import AutoScroll from "embla-carousel-auto-scroll";

// 滚动配置
const scrollPlugin = useRef(
  AutoScroll({
    startDelay: 500,
    speed: 0.7, // 可调整滚动速度
  })
);

// 渐变遮罩样式（参考 testimonial 实现）
const gradientMaskClasses = `
  relative 
  before:absolute before:bottom-0 before:left-0 before:top-0 before:z-10 before:w-36 
  before:bg-linear-to-r before:from-background before:to-transparent 
  after:absolute after:bottom-0 after:right-0 after:top-0 after:z-10 after:w-36 
  after:bg-linear-to-l after:from-background after:to-transparent
`;
```

### 交互行为

1. **自动滚动**: 页面加载后自动开始滚动
2. **悬停暂停**: 鼠标悬停时暂停滚动
3. **点击交互**: 点击示例图片时填充提示词到输入框
4. **无限循环**: 滚动到末尾时无缝循环到开头
5. **渐变遮罩**: 左右两侧渐变遮罩营造无限滚动视觉效果

### 示例图片组件结构

```typescript
// 示例图片项组件
interface ExampleImageItemProps {
  image: ExampleImage;
  onSelect: (prompt: string) => void;
}

const ExampleImageItem = ({ image, onSelect }: ExampleImageItemProps) => (
  <CarouselItem className="basis-auto">
    <div 
      className="cursor-pointer select-none p-2"
      onClick={() => onSelect(image.prompt)}
    >
      <div className="relative overflow-hidden rounded-full">
        <Image
          src={image.src}
          alt={image.alt}
          width={80}
          height={80}
          className="object-cover transition-transform hover:scale-110"
        />
      </div>
    </div>
  </CarouselItem>
);
```