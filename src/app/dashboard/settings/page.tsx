import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  let email: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    email = user?.email ?? null;
  } catch {
    // skeleton
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Card className="p-6 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Email</span>
          <span>{email ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Plan</span>
          <span>MVP</span>
        </div>
      </Card>
    </div>
  );
}
