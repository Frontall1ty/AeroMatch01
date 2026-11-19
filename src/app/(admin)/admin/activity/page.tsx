import { DataTable, Empty, PageHead, TD, TH, THEAD, TROW } from "@/components/admin/AdminUI";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Activity() {
  await requireAdmin();
  const rows = await prisma.adminAction.findMany({ orderBy: { at: "desc" }, take: 200 });
  return (
    <div>
      <PageHead title="Activity">A record of what was done in this console: verifying, suspending, closing listings and resetting the demo. Newest first, the last 200.</PageHead>
      {rows.length === 0 ? (
        <Empty>Nothing has been done yet. When you verify a carrier or close a listing, it is recorded here.</Empty>
      ) : (
        <DataTable minWidth={760}>
          <thead className={THEAD}>
            <tr><th className={TH}>When (UTC)</th><th className={TH}>Action</th><th className={TH}>On</th><th className={TH}>Note</th></tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className={TROW}>
                <td className={TD}>{a.at.toISOString().slice(0, 16).replace("T", " ")}</td>
                <td className={`${TD} font-semibold`}>{a.action}</td>
                <td className={TD}>{a.targetName}<span className="block text-xs text-console-muted">{a.targetType}</span></td>
                <td className={`${TD} text-console-muted`}>{a.detail}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}
