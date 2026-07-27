import { useEffect, useState } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { Trash2, RefreshCw, TestTube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DEMO_TTL_DAYS = 5;

interface DemoRow {
  id: string;
  display_name: string | null;
  created_at: string;
  total: number;
}

const DemoAccountsCard = () => {
  const [rows, setRows] = useState<DemoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data: profs, error } = await supabase
        .from("profiles")
        .select("id, display_name, created_at")
        .eq("is_test", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const ids = (profs ?? []).map((p: any) => p.id);
      let totals: Record<string, number> = {};
      if (ids.length) {
        const { data: entries } = await supabase
          .from("push_up_entries")
          .select("user_id, count")
          .in("user_id", ids);
        (entries ?? []).forEach((e: any) => {
          totals[e.user_id] = (totals[e.user_id] ?? 0) + e.count;
        });
      }
      setRows(
        (profs ?? []).map((p: any) => ({
          id: p.id,
          display_name: p.display_name,
          created_at: p.created_at,
          total: totals[p.id] ?? 0,
        })),
      );
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load demo accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const deleteOne = async (userId: string) => {
    if (!confirm("Delete this demo account and all its data?")) return;
    setBusyId(userId);
    try {
      const { error } = await supabase.functions.invoke("delete-demo-account", {
        body: { user_id: userId },
      });
      if (error) throw error;
      toast.success("Demo account deleted");
      setRows((r) => r.filter((x) => x.id !== userId));
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  const expired = rows.filter(
    (r) => differenceInCalendarDays(new Date(), new Date(r.created_at)) >= DEMO_TTL_DAYS,
  );

  const deleteExpired = async () => {
    if (!expired.length) return;
    if (!confirm(`Delete ${expired.length} expired demo account${expired.length === 1 ? "" : "s"}?`)) return;
    for (const r of expired) {
      // eslint-disable-next-line no-await-in-loop
      await supabase.functions.invoke("delete-demo-account", { body: { user_id: r.id } });
    }
    toast.success("Expired demo accounts deleted");
    load();
  };

  return (
    <div
      className="bg-card/40 rounded-2xl mt-6 animate-slide-up p-4 border border-[#3B404F]"
      style={{ animationDelay: "0.036s" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TestTube className="w-5 h-5 text-[#0ABAB5]" />
          <h2 className="text-lg text-foreground font-semibold">Demo Accounts</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={load} disabled={loading} aria-label="Reload">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Auto-created via the "Try the demo" button. Expire after {DEMO_TTL_DAYS} days — delete
        manually.
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No demo accounts.</p>
      ) : (
        <div className="divide-y divide-[#3B404F]">
          {rows.map((r) => {
            const age = differenceInCalendarDays(new Date(), new Date(r.created_at));
            const left = DEMO_TTL_DAYS - age;
            const isExpired = left <= 0;
            return (
              <div key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-foreground truncate">{r.display_name ?? "(no name)"}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(r.created_at), "MMM d")} · {r.total} PU ·{" "}
                    <span className={isExpired ? "text-red-400" : "text-[#0ABAB5]"}>
                      {isExpired ? "expired" : `${left}d left`}
                    </span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteOne(r.id)}
                  disabled={busyId === r.id}
                  aria-label="Delete"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {expired.length > 0 && (
        <Button
          variant="outline"
          onClick={deleteExpired}
          className="w-full h-10 mt-3 border-red-500/60 text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete {expired.length} expired
        </Button>
      )}
    </div>
  );
};

export default DemoAccountsCard;
