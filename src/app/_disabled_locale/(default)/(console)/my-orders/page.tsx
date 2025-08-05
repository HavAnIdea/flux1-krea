import { getUserUuid } from "@/services/user";
import { redirect } from "next/navigation";

export default async function () {
  const user_uuid = await getUserUuid();

  const callbackUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/subscription`;
  if (!user_uuid) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  // Redirect to subscription management page
  redirect("/subscription");
}