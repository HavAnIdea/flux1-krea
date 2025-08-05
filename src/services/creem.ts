import crypto from 'crypto';
import {
  CreemCheckoutRequest,
  CreemCheckoutResponse,
  CreemReturnUrlParams,
  CreemWebhookPayload,
} from '@/types/subscription';

export class CreemService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.CREEM_API_KEY || '';
    this.apiUrl = process.env.CREEM_API_URL || 'https://api.creem.io/v1';
    
    // 只在运行时检查，构建时不检查
    if (!this.apiKey && process.env.NODE_ENV !== 'production') {
      console.warn('CREEM_API_KEY environment variable is not set');
    }
  }

  /**
   * 创建 Creem 支付会话
   */
  async createCheckoutSession(
    productId: string,
    requestId?: string,
    successUrl?: string
  ): Promise<CreemCheckoutResponse> {
    if (!this.apiKey) {
      throw new Error('CREEM_API_KEY environment variable is required');
    }
    
    try {
      const requestData: CreemCheckoutRequest = {
        product_id: productId,
      };

      if (requestId) {
        requestData.request_id = requestId;
      }

      if (successUrl) {
        requestData.success_url = successUrl;
      }

      console.log('🔧 Creem API 请求信息:');
      console.log('API URL:', `${this.apiUrl}/checkouts`);
      console.log('Product ID:', productId);
      console.log('Request ID:', requestId);
      console.log('Success URL:', successUrl);
      console.log('API Key (前4位):', this.apiKey.substring(0, 4) + '...');
      console.log('Request Body:', JSON.stringify(requestData, null, 2));

      const response = await fetch(`${this.apiUrl}/checkouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(requestData),
      });

      console.log('📡 Creem API 响应状态:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Creem API 错误响应:', errorText);
        throw new Error(`Creem API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Creem API 成功响应:', data);
      
      return {
        checkout_url: data.checkout_url,
        checkout_id: data.checkout_id || data.id,
      };
    } catch (error) {
      console.error('Error creating Creem checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * 验证 Creem 返回 URL 的签名
   */
  verifyReturnUrlSignature(params: CreemReturnUrlParams): boolean {
    if (!this.apiKey) {
      console.error('CREEM_API_KEY is required for signature verification');
      return false;
    }
    
    try {
      const { signature, ...otherParams } = params;
      
      // 按照官方文档生成签名（保持原始顺序）
      const paramOrder = ['request_id', 'checkout_id', 'order_id', 'customer_id', 'subscription_id', 'product_id'];
      const data = paramOrder
        .filter(key => otherParams[key as keyof typeof otherParams] !== undefined && otherParams[key as keyof typeof otherParams] !== null)
        .map(key => `${key}=${otherParams[key as keyof typeof otherParams]}`)
        .concat(`salt=${this.apiKey}`)
        .join('|');
      
      const expectedSignature = crypto
        .createHash('sha256')
        .update(data)
        .digest('hex');
      
      console.log('🔍 签名验证调试:');
      console.log('输入数据:', data);
      console.log('预期签名:', expectedSignature);
      console.log('实际签名:', signature);
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Error verifying Creem signature:', error);
      return false;
    }
  }

  /**
   * 验证 Creem webhook 签名
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.apiKey) {
      console.error('CREEM_API_KEY is required for webhook signature verification');
      return false;
    }
    
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.apiKey)
        .update(payload)
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      console.error('Error verifying Creem webhook signature:', error);
      return false;
    }
  }

  /**
   * 解析 Creem 返回 URL 参数
   */
  parseReturnUrlParams(url: string): CreemReturnUrlParams | null {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      const requiredParams = ['checkout_id', 'order_id', 'customer_id', 'product_id', 'signature'];
      for (const param of requiredParams) {
        if (!params.get(param)) {
          throw new Error(`Missing required parameter: ${param}`);
        }
      }

      return {
        checkout_id: params.get('checkout_id')!,
        order_id: params.get('order_id')!,
        customer_id: params.get('customer_id')!,
        subscription_id: params.get('subscription_id') || undefined,
        product_id: params.get('product_id')!,
        request_id: params.get('request_id') || undefined,
        signature: params.get('signature')!,
      };
    } catch (error) {
      console.error('Error parsing Creem return URL params:', error);
      return null;
    }
  }

  /**
   * 从 URL 直接验证签名
   */
  verifySignatureFromUrl(url: string): boolean {
    if (!this.apiKey) {
      console.error('CREEM_API_KEY is required for signature verification');
      return false;
    }
    
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;
      
      // 获取签名
      const signature = params.get('signature');
      if (!signature) {
        throw new Error('Missing signature in URL');
      }
      
      // 按照原始 URL 中的参数顺序构建签名字符串
      const signatureParams: string[] = [];
      params.forEach((value, key) => {
        if (key !== 'signature' && value !== null && value !== undefined) {
          signatureParams.push(`${key}=${value}`);
        }
      });
      
      // 添加 salt
      signatureParams.push(`salt=${this.apiKey}`);
      
      const data = signatureParams.join('|');
      const expectedSignature = crypto
        .createHash('sha256')
        .update(data)
        .digest('hex');
      
      console.log('🔍 URL 签名验证调试:');
      console.log('URL 参数顺序:', Array.from(params.keys()).filter(k => k !== 'signature'));
      console.log('输入数据:', data);
      console.log('预期签名:', expectedSignature);
      console.log('实际签名:', signature);
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Error verifying Creem signature from URL:', error);
      return false;
    }
  }

  /**
   * 处理支付成功的返回 URL
   */
  async handlePaymentSuccess(params: CreemReturnUrlParams): Promise<{
    userId: number;
    planId: number;
    orderId: string;
    customerId: string;
  }> {
    try {
      // 验证签名
      if (!this.verifyReturnUrlSignature(params)) {
        throw new Error('Invalid signature');
      }

      // 从 request_id 中解析用户ID和套餐ID
      // request_id 格式应该是: "user_{userId}_plan_{planId}"
      if (!params.request_id) {
        throw new Error('Missing request_id in return URL');
      }

      const requestIdMatch = params.request_id.match(/^user_(\d+)_plan_(\d+)$/);
      if (!requestIdMatch) {
        throw new Error('Invalid request_id format');
      }

      const userId = parseInt(requestIdMatch[1]);
      const planId = parseInt(requestIdMatch[2]);

      return {
        userId,
        planId,
        orderId: params.order_id,
        customerId: params.customer_id,
      };
    } catch (error) {
      console.error('Error handling Creem payment success:', error);
      throw error;
    }
  }

  /**
   * 处理 webhook 事件
   */
  async handleWebhookEvent(payload: CreemWebhookPayload): Promise<{
    userId: number;
    planId: number;
    orderId: string;
    customerId: string;
    eventType: string;
  }> {
    try {
      // 从 request_id 中解析用户ID和套餐ID
      if (!payload.request_id) {
        throw new Error('Missing request_id in webhook payload');
      }

      const requestIdMatch = payload.request_id.match(/^user_(\d+)_plan_(\d+)$/);
      if (!requestIdMatch) {
        throw new Error('Invalid request_id format in webhook');
      }

      const userId = parseInt(requestIdMatch[1]);
      const planId = parseInt(requestIdMatch[2]);

      return {
        userId,
        planId,
        orderId: payload.order_id,
        customerId: payload.customer_id,
        eventType: payload.event_type,
      };
    } catch (error) {
      console.error('Error handling Creem webhook event:', error);
      throw error;
    }
  }

  /**
   * 生成 request_id
   */
  generateRequestId(userId: number, planId: number): string {
    return `user_${userId}_plan_${planId}`;
  }

  /**
   * 获取支付成功页面 URL
   */
  getSuccessUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
    return `${baseUrl}/payment-success`;
  }

  /**
   * 获取支付取消页面 URL
   */
  getCancelUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
    return `${baseUrl}/#pricing`;
  }

  /**
   * 测试签名生成 - 仅用于调试
   */
  testSignatureGeneration(): void {
    if (!this.apiKey) {
      console.error('CREEM_API_KEY is required for signature test');
      return;
    }

    // 模拟返回 URL 参数
    const testParams = {
      checkout_id: 'chk_123456789',
      order_id: 'ord_123456789',
      customer_id: 'cus_123456789',
      product_id: 'prod_123456789',
      request_id: 'user_1_plan_1',
    };

    console.log('🧪 测试签名生成:');
    console.log('测试参数:', testParams);

    // 生成签名
    const data = Object.entries(testParams)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${value}`)
      .concat(`salt=${this.apiKey}`)
      .join('|');

    const signature = crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');

    console.log('生成的签名字符串:', data);
    console.log('生成的签名:', signature);

    // 验证签名
    const verificationParams = {
      ...testParams,
      signature,
    };

    const isValid = this.verifyReturnUrlSignature(verificationParams);
    console.log('签名验证结果:', isValid ? '✅ 成功' : '❌ 失败');
  }
}

// 导出单例实例
export const creemService = new CreemService();