import { creemService } from "@/services/creem";
import { subscriptionService } from "@/services/subscription";
import { getSubscriptionPlanById } from "@/models/subscription-plans";
import { respData, respErr } from "@/lib/resp";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    
    // 直接从 URL 验证签名
    if (!creemService.verifySignatureFromUrl(url.toString())) {
      return respErr("Invalid signature");
    }
    
    // 解析返回 URL 参数
    const params = creemService.parseReturnUrlParams(url.toString());
    if (!params) {
      return respErr("Invalid return URL parameters");
    }

    // 处理支付成功
    const { userId, planId, orderId, customerId } = await creemService.handlePaymentSuccess(params);

    // 获取套餐信息
    const plan = await getSubscriptionPlanById(planId);
    if (!plan) {
      return respErr("Subscription plan not found");
    }

    // 检查是否已经处理过这个订单
    const existingSubscription = await subscriptionService.getSubscriptionByOrderId(orderId);
    if (existingSubscription) {
      // 订单已处理，返回现有订阅信息
      return respData({
        message: "Payment already processed",
        subscription: existingSubscription,
        plan: plan,
      });
    }

    // 创建订阅记录（如果 webhook 还没有处理）
    const subscription = await subscriptionService.handlePaymentSuccess(
      userId,
      planId,
      orderId,
      plan.price / 100, // 假设价格以分为单位存储
      'creem'
    );

    return respData({
      message: "Payment processed successfully",
      subscription: subscription,
      plan: plan,
    });
  } catch (error: any) {
    console.error("Creem return URL processing failed:", error);
    return respErr("Payment processing failed: " + error.message);
  }
}