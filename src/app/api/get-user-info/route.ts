import { respData, respErr, respJson } from "@/lib/resp";

import { findUserByUuid } from "@/models/user";
import { getUserUuid } from "@/services/user";
import { User } from "@/types/user";
import { subscriptionService } from "@/services/subscription";

export async function POST(req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }


    const dbUser = await findUserByUuid(user_uuid);
    if (!dbUser) {
      return respErr("user not exist");
    }


    // 获取用户的订阅状态
    const subscriptionInfo = await subscriptionService.getCurrentUserPlan(dbUser.id);


    // Note: Credits system disabled - using usage limits instead
    // User limits are managed through the usage-limits system
    const user = {
      ...(dbUser as unknown as User),
      // 使用订阅信息中的 plan，而不是数据库中的 plan
      plan: subscriptionInfo.plan,
      subscription: subscriptionInfo,
      // Remove credits field as it's no longer used
    };


    return respData(user);
  } catch (e) {
    console.error("[GET-USER-INFO] get user info failed: ", e);
    return respErr("get user info failed");
  }
}
