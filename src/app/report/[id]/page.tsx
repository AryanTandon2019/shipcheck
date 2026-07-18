import { getStore } from "@/lib/storage";
import { ReportLoader } from "@/components/report-loader";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let initial = null;
  try {
    initial = await getStore().get(id);
    if (initial?.status === "failed") initial = null;
  } catch {
    initial = null;
  }

  return <ReportLoader id={id} initial={initial} />;
}
