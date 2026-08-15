import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/AdminGuard";
import { Container } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchSettings, updateSetting, type PlatformSetting } from "@/lib/admin";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Admin settings — NepCollab" }] }),
  component: () => (
    <AdminGuard>
      <AdminSettings />
    </AdminGuard>
  ),
});

function AdminSettings() {
  const [rows, setRows] = useState<PlatformSetting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const reload = async () => {
    try {
      const data = await fetchSettings();
      setRows(data);
      const d: Record<string, string> = {};
      data.forEach((s) => {
        d[s.key] = s.value ?? "";
      });
      setDrafts(d);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load settings");
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Platform settings</h1>
        <p className="text-sm text-muted-foreground">
          Marketplace flags (payments, fees, launch status). Does not process money on-platform.
        </p>
      </div>

      <div className="space-y-4">
        {rows.map((s) => (
          <div key={s.key} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex-1">
                <p className="font-medium">{s.key}</p>
                {s.description && (
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                )}
                <Input
                  className="mt-2 max-w-md"
                  value={drafts[s.key] ?? ""}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [s.key]: e.target.value }))
                  }
                />
              </div>
              <Button
                onClick={async () => {
                  try {
                    await updateSetting(s.key, drafts[s.key] ?? "");
                    toast.success("Saved");
                    await reload();
                  } catch (e: any) {
                    toast.error(e?.message || "Save failed");
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No settings rows found.</p>
        )}
      </div>
    </Container>
  );
}
