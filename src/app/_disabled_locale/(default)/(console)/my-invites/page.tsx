import { RiDiscordFill, RiEmotionSadFill, RiGithubFill } from "react-icons/ri";
import {
  getAffiliatesByUserUuid,
  getAffiliateSummary,
} from "@/models/affiliate";
// Order system removed - using subscription system now
import { getUserEmail, getUserUuid } from "@/services/user";

import Invite from "@/components/invite";
import Link from "next/link";
import TableBlock from "@/components/blocks/table";
import { TableColumn } from "@/types/blocks/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { findUserByUuid } from "@/models/user";
import { getTranslations } from "next-intl/server";
import moment from "moment";
import { redirect } from "next/navigation";

export default async function () {
  const t = await getTranslations();

  const user_uuid = await getUserUuid();
  const user_email = await getUserEmail();

  const callbackUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/my-invites`;
  if (!user_uuid) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const user = await findUserByUuid(user_uuid);
  if (!user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  // Simplified affiliate access - now based on subscription system
  // TODO: Implement subscription-based affiliate eligibility check
  user.is_affiliate = true; // For now, allow all users to access affiliate features

  const affiliates = await getAffiliatesByUserUuid(user_uuid);

  const summary = await getAffiliateSummary(user_uuid);

  const columns: TableColumn[] = [
    {
      name: "created_at",
      title: t("my_invites.table.invite_time"),
      callback: (item) => moment(item.created_at).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      name: "user",
      title: t("my_invites.table.invite_user"),
      callback: (item) => (
        <div className="flex items-center gap-2">
          {item?.user?.avatar_url && (
            <img
              src={item.user?.avatar_url || ""}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span>{item.user?.nickname}</span>
        </div>
      ),
    },
    {
      name: "status",
      title: t("my_invites.table.status"),
      callback: (item) =>
        item.status === "pending"
          ? t("my_invites.table.pending")
          : t("my_invites.table.completed"),
    },
    {
      name: "reward_amount",
      title: t("my_invites.table.reward_amount"),
      callback: (item) => `$${item.reward_amount / 100}`,
    },
  ];

  const table: TableSlotType = {
    title: t("my_invites.title"),
    description: t("my_invites.description"),
    tip: {
      description: t("my_invites.my_invite_link"),
    },
    toolbar: {
      items: [
        {
          title: t("my_invites.edit_invite_link"),
          icon: "RiBookLine",
          url: "https://docs.shipany.ai",
          target: "_blank",
          variant: "outline",
        },
        {
          title: t("my_invites.copy_invite_link"),
          icon: "RiCopy2Line",
          url: "https://discord.gg/HQNnrzjZQS",
          target: "_blank",
        },
      ],
    },
    columns: columns,
    data: affiliates,
    empty_message: t("my_invites.no_invites"),
  };

  return (
    <div className="space-y-8">
      <Invite summary={summary} />
      <TableBlock {...table} />
    </div>
  );
}
