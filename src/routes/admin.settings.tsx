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
      <Page />
    </AdminGuard>
  ),
});

const TOGGLES = ["maintenance_mode", "registration_open", "require_creator_verification", "require_brand_verification"];

function Page() {
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

  const save = async (key: string, value: string) => {
    try {
      await updateSetting(key, value);
      toast.success("Saved");
      await reload();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    }
  };

  return (
    <Container className="space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Platform settings</h1>
        <p className="text-sm text-muted-foreground">
          Persisted via <code className="text-xs">admin_set_platform_setting</code>. App reads these for maintenance and registration.
        </p>
      </div>
      <div className="space-y-4">
        {rows.map((s) => {
          const isToggle = TOGGLES.includes(s.key) || s.value === "true" || s.value === "false";
          return (
            <div key={s.key} className="rounded-2xl border border-border bg-card p-4">
              <p className="font-medium">{s.key}</p>
              {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {isToggle ? (
                  <Button
                    size="sm"
                    variant={(drafts[s.key] ?? s.value) === "true" ? "default" : "outline"}
                    onClick={() => {
                      const next = (drafts[s.key] ?? s.value) === "true" ? "false" : "true";
                      setDrafts((d) => ({ ...d, [s.key]: next }));
                      void save(s.key, next);
                    }}
                  >
                    {(drafts[s.key] ?? s.value) === "true" ? "On" : "Off"}
                  </Button>
                ) : (
                  <>
                    <Input
                      className="max-w-md"
                      value={drafts[s.key] ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [s.key]: e.target.value }))}
                    />
                    <Button size="sm" onClick={() => save(s.key, drafts[s.key] ?? "")}>
                      Save
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No settings rows.</p>}
      </div>
    </Container>
  );
}
