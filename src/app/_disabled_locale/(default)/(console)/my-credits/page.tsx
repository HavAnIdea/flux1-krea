import Empty from "@/components/blocks/empty";
import { getUserUuid } from "@/services/user";
import { redirect } from "next/navigation";

export default async function () {
  const user_uuid = await getUserUuid();

  if (!user_uuid) {
    return <Empty message="Please sign in to view your subscription" />;
  }

  // Redirect to subscription management page
  redirect("/subscription");
}
