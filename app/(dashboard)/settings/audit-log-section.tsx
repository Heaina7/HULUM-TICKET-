import { HistoryIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import type { AuditLog } from "@/types";

export function AuditLogSection({ logs }: { logs: AuditLog[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit log</CardTitle>
        <CardDescription>Recent administrative actions across the system.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {logs.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState icon={HistoryIcon} title="No activity recorded yet" />
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2 font-medium">When</th>
                  <th className="px-5 py-2 font-medium">Admin</th>
                  <th className="px-5 py-2 font-medium">Action</th>
                  <th className="px-5 py-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-2.5 whitespace-nowrap text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-2.5 font-medium text-foreground">
                      {log.admin_username ?? "—"}
                    </td>
                    <td className="px-5 py-2.5 text-muted-foreground">{log.action}</td>
                    <td className="px-5 py-2.5 text-muted-foreground">{log.details ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
