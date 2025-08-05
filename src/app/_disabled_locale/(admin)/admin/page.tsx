import DataCards from "@/components/blocks/data-cards";
import DataCharts from "@/components/blocks/data-charts";
import Header from "@/components/dashboard/header";
// Order system removed - using subscription system now
import { getUserCountByDate, getUsersTotal } from "@/models/user";
import { getFeedbacksTotal } from "@/models/feedback";
import { getPostsTotal } from "@/models/post";
import { DataCard } from "@/types/blocks/base";

export default async function () {
  const totalPaidOrders = 0; // TODO: Implement subscription count
  const totalUsers = await getUsersTotal();
  const totalFeedbacks = await getFeedbacksTotal();
  const totalPosts = await getPostsTotal();

  const dataCards: DataCard[] = [
    {
      title: "Total Users",
      label: "",
      value: (totalUsers || 0).toString(),
      description: "Total users registered in the system",
    },
    {
      title: "Active Subscriptions",
      label: "",
      value: (totalPaidOrders || 0).toString(),
      description: "Active user subscriptions",
    },
    {
      title: "System Posts",
      label: "",
      value: (totalPosts || 0).toString(),
      description: "Posts in total",
    },
    {
      title: "User Feedbacks",
      label: "",
      value: (totalFeedbacks || 0).toString(),
      description: "Feedbacks in total",
    },
  ];

  // Get data for the last 30 days
  const startTime = new Date();
  startTime.setDate(startTime.getDate() - 90);
  const users = await getUserCountByDate(startTime.toISOString());

  // Create chart data with users only for now
  const allDates = new Set([
    ...(users ? Array.from(users.keys()) : []),
  ]);

  const data = Array.from(allDates)
    .sort()
    .map((date) => ({
      date,
      users: users?.get(date) || 0,
      subscriptions: 0, // TODO: Implement subscription count by date
    }));

  const fields = [
    { key: "users", label: "Users", color: "var(--primary)" },
    { key: "subscriptions", label: "Subscriptions", color: "var(--secondary)" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Header />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DataCards dataCards={dataCards} />
            <div className="px-4 lg:px-6">
              <DataCharts
                data={data}
                fields={fields}
                title="Users and Subscriptions Overview"
                description="Daily users and subscriptions data"
                defaultTimeRange="90d"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
