import { getUserUuid } from "@/services/user";
import { getSubscriptionPlanById } from "@/models/subscription-plans";
import { creemService } from "@/services/creem";
import { respData, respErr } from "@/lib/resp";
import { findUserByUuid } from "@/models/user";

export async function POST(req: Request) {
  try {
    const { plan_id } = await req.json();

    if (!plan_id || typeof plan_id !== 'number') {
      return respErr("Invalid plan_id parameter");
    }

    // 验证用户身份
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("Authentication required");
    }

    // 获取用户信息
    const user = await findUserByUuid(user_uuid);
    if (!user) {
      return respErr("User not found");
    }

    // 验证套餐是否存在
    const plan = await getSubscriptionPlanById(plan_id);
    if (!plan) {
      return respErr("Subscription plan not found");
    }

    console.log('📋 套餐信息:', {
      id: plan.id,
      name: plan.name,
      product_id: plan.product_id,
      price: plan.price,
      currency: plan.currency
    });

    // 检查套餐是否有 product_id
    if (!plan.product_id) {
      return respErr("Product ID not configured for this plan");
    }

    // 生成 request_id 用于跟踪支付
    const requestId = creemService.generateRequestId(user.id, plan_id);

    // 获取成功页面 URL
    const successUrl = creemService.getSuccessUrl();

    // 创建 Creem checkout session
    const checkoutSession = await creemService.createCheckoutSession(
      plan.product_id,
      requestId,
      successUrl
    );

    return respData({
      checkout_url: checkoutSession.checkout_url,
      checkout_id: checkoutSession.checkout_id,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        period: plan.period,
      },
    });
  } catch (error: any) {
    console.error("Creem checkout failed:", error);
    return respErr("Checkout failed: " + error.message);
  }
}