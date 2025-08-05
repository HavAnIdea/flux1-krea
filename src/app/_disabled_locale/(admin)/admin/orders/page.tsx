import { TableColumn } from "@/types/blocks/table";
import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";

export default async function () {
  // Orders system replaced with subscriptions
  // TODO: Implement subscription management for admin
  
  const columns: TableColumn[] = [
    { name: "message", title: "Status" },
  ];

  const table: TableSlotType = {
    title: "Subscriptions (Coming Soon)",
    columns,
    data: [{ message: "Subscription management will be implemented here" }],
  };

  return <TableSlot {...table} />;
}
