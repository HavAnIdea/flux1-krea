import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get('path');

    if (!imagePath) {
      return NextResponse.json(
        { error: "Image path is required" },
        { status: 400 }
      );
    }

    // 验证路径格式是否正确（应该以/image/开头）
    if (!imagePath.startsWith('/image/')) {
      return NextResponse.json(
        { error: "Invalid image path" },
        { status: 400 }
      );
    }

    // 拼接完整的Runware图片URL
    const fullImageUrl = `https://im.runware.ai${imagePath}`;

    // 获取原始图片，设置30秒超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(fullImageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const contentLength = response.headers.get('content-length');

    // 使用流式传输来提高性能，不需要等待整个图片下载完成
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable', // 缓存1年
      'Content-Disposition': 'inline',
    };

    // 如果有内容长度，也传递给客户端
    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }

    // 直接流式传输响应体，而不是先下载到内存
    return new NextResponse(response.body, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error("Image proxy error:", error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: "Image request timeout" },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}