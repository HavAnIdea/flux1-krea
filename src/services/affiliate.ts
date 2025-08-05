import { findAffiliateByOrderNo, insertAffiliate } from "@/models/affiliate";

import { AffiliateRewardAmount } from "./constant";
import { AffiliateRewardPercent } from "./constant";
import { AffiliateStatus } from "./constant";
// Order type removed - using subscription system now
import { findUserByUuid } from "@/models/user";
import { getIsoTimestr } from "@/lib/time";

export async function updateAffiliateForSubscription(
  user_uuid: string,
  subscription_id: string,
  amount: number
) {
  try {
    const user = await findUserByUuid(user_uuid);
    if (user && user.uuid && user.invited_by && user.invited_by !== user.uuid) {
      // Check if affiliate record already exists for this subscription
      const affiliate = await findAffiliateByOrderNo(subscription_id);
      if (affiliate) {
        return;
      }

      await insertAffiliate({
        user_uuid: user.uuid,
        invited_by: user.invited_by,
        created_at: new Date(),
        status: AffiliateStatus.Completed,
        paid_order_no: subscription_id, // Using subscription ID instead of order number
        paid_amount: amount,
        reward_percent: AffiliateRewardPercent.Paied,
        reward_amount: AffiliateRewardAmount.Paied,
      });
    }
  } catch (e) {
    console.log("update affiliate for subscription failed: ", e);
    throw e;
  }
}
