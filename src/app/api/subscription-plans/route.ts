import { getAllSubscriptionPlans } from "@/models/subscription-plans";
import { respData, respErr } from "@/lib/resp";

export async function GET() {
  try {
    const plans = await getAllSubscriptionPlans();
    
    return respData(plans);
  } catch (error: any) {
    console.error("Failed to fetch subscription plans:", error);
    return respErr("Failed to fetch subscription plans: " + error.message);
  }
}