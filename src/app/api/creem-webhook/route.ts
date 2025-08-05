import { creemService } from "@/services/creem";
import { subscriptionService } from "@/services/subscription";
import { getSubscriptionPlanById } from "@/models/subscription-plans";
import { respOk } from "@/lib/resp";
import { CreemWebhookPayload, PaymentStatusEnum } from "@/types/subscription";

export async function POST(req: Request) {
  try {
    // 获取请求体和签名
    const body = await req.text();
    const signature = req.headers.get("x-creem-signature") || req.headers.get("signature") || "";

    if (!signature) {
      console.error("Missing Creem webhook signature");
      return Response.json({ error: "Missing signature" }, { status: 400 });
    }

    // 验证 webhook 签名
    if (!creemService.verifyWebhookSignature(body, signature)) {
      console.error("Invalid Creem webhook signature");
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 解析 webhook 数据
    const webhookData: CreemWebhookPayload = JSON.parse(body);
    console.log("Received Creem webhook:", webhookData);

    // 处理不同的事件类型
    switch (webhookData.event_type) {
      case 'payment.completed':
        await handlePaymentCompleted(webhookData);
        break;
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(webhookData);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(webhookData);
        break;
      
      default:
        console.log(`Unhandled webhook event type: ${webhookData.event_type}`);
    }

    return respOk();
  } catch (error: any) {
    console.error("Creem webhook processing failed:", error);
    return Response.json(
      { error: `Webhook processing failed: ${error.message}` },
      { status: 500 }
    );
  }
}

async function handlePaymentCompleted(webhookData: CreemWebhookPayload) {
  try {
    // 解析用户和套餐信息
    const { userId, planId, orderId, customerId } = await creemService.handleWebhookEvent(webhookData);

    // 获取套餐信息
    const plan = await getSubscriptionPlanById(planId);
    if (!plan) {
      throw new Error(`Subscription plan not found: ${planId}`);
    }

    // 创建订阅记录
    const subscription = await subscriptionService.handlePaymentSuccess(
      userId,
      planId,
      orderId,
      webhookData.amount / 100, // Creem 通常以分为单位，转换为元
      'creem'
    );

    console.log(`Payment completed successfully for user ${userId}, subscription ${subscription.id}`);
  } catch (error) {
    console.error("Error handling payment completed:", error);
    throw error;
  }
}

async function handleSubscriptionCancelled(webhookData: CreemWebhookPayload) {
  try {
    // 解析用户和套餐信息
    const { userId, orderId } = await creemService.handleWebhookEvent(webhookData);

    // 查找并停用订阅
    const subscription = await subscriptionService.getSubscriptionByOrderId(orderId);
    if (subscription) {
      await subscriptionService.updateSubscriptionStatus(
        subscription.id,
        subscription.payment_status as PaymentStatusEnum, // 保持原有支付状态
        false // 设置为非活跃状态
      );
      console.log(`Subscription cancelled for user ${userId}, subscription ${subscription.id}`);
    } else {
      console.warn(`Subscription not found for order ${orderId}`);
    }
  } catch (error) {
    console.error("Error handling subscription cancelled:", error);
    throw error;
  }
}

async function handlePaymentFailed(webhookData: CreemWebhookPayload) {
  try {
    // 解析用户和套餐信息
    const { userId, orderId } = await creemService.handleWebhookEvent(webhookData);

    console.log(`Payment failed for user ${userId}, order ${orderId}`);
    
    // 这里可以添加失败处理逻辑，比如发送通知邮件等
    // 由于支付失败，通常不需要创建订阅记录
  } catch (error) {
    console.error("Error handling payment failed:", error);
    throw error;
  }
}