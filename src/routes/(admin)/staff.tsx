import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  UserPlus,
  ShieldCheck,
  Scan,
  Loader2,
  Copy,
  CheckCircle2,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/shared/components/layout/DashboardShell";
import { AdminGuard } from "@/shared/components/layout/RoleGuard";
import { useAuth } from "@/shared/hooks/useAuth";
import { wards } from "@/shared/lib/kwali-mock";
import {
  createStaffAccount,
  fetchStaffAccounts,
  type StaffAccount,
} from "@/shared/lib/api/staff.functions";

export const Route = createFileRoute("/(admin)/staff")({
  head: () => ({ meta: [{ title: "Staff Accounts — Kwali Revenue Portal" }] }),
  component: StaffPage,
});

// Staff accounts are created by administrators only — there is no public
// sign-up path for marshal or officer roles, because the council decides who
// carries enforcement and collection authority.

const ROLE_META: Record<StaffAccount["role"], { label: string; desc: string; icon: React.ReactNode }> = {
  marshal: {
    label: "Marshal",
    desc: "Field enforcement — verifies tickets, onboards traders, logs incidents",
    icon: <Scan className="h-4 w-4" />,
  },
  officer: {
    label: "Revenue Officer",
    desc: "Approvals and collections — reviews registrations, records payments",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
};

function StaffPage() {
  return (
    <DashboardShell title="Staff Accounts" subtitle="Create and manage marshal & officer logins">
      <AdminGuard>
        <StaffContent />
      </AdminGuard>
    </DashboardShell>
  );
}

function StaffContent() {
  const { session } = useAuth();
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ward, setWard] = useState(wards[0]);
  const [role, setRole] = useState<StaffAccount["role"]>("marshal");
  const [password, setPassword] = useState("");

  // Credentials of the most recently created account, shown once so the admin
  // can hand them over — they are not retrievable afterwards.
  const [issued, setIssued] = useState<{ email: string; password: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const token = session?.access_token ?? "";

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setStaff(await fetchStaffAccounts({ data: { callerToken: token } }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load staff accounts");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const account = await createStaffAccount({
        data: {
          callerToken: token,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          ward,
          role,
          password,
        },
      });
      toast.success(`${ROLE_META[account.role].label} account created`, {
        description: `${account.fullName} can now sign in`,
      });
      setIssued({ email: email.trim(), password, name: account.fullName });
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Account creation failed");
    } finally {
      setSaving(false);
    }
  }

  function copyCredentials() {
    if (!issued) return;
    navigator.clipboard
      .writeText(`Kwali Revenue Portal login\nEmail: ${issued.email}\nPassword: ${issued.password}`)
      .catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const marshals = staff.filter((s) => s.role === "marshal");
  const officers = staff.filter((s) => s.role === "officer");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Stats strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total staff" value={staff.length} icon={<Users className="h-5 w-5" />} />
        <Stat label="Marshals" value={marshals.length} icon={<Scan className="h-5 w-5" />} />
        <Stat label="Revenue officers" value={officers.length} icon={<ShieldCheck className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Create account */}
        <div className="surface-card lg:col-span-2">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-display text-base font-bold text-ink">Create staff account</h2>
            <p className="text-xs text-muted-foreground">
              The officer or marshal signs in with these credentials and should change the
              password after first login.
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4 p-6">
            {/* Role picker */}
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ROLE_META) as StaffAccount["role"][]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={
                    "rounded-xl border p-3 text-left transition " +
                    (role === r
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40")
                  }
                >
                  <div className="flex items-center gap-2 font-semibold text-ink">
                    <span className={role === r ? "text-primary" : "text-muted-foreground"}>
                      {ROLE_META[r].icon}
                    </span>
                    {ROLE_META[r].label}
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                    {ROLE_META[r].desc}
                  </p>
                </button>
              ))}
            </div>

            <Field label="Full name" value={fullName} onChange={setFullName} required placeholder="e.g. Aisha Bello" />
            <Field label="Email" type="email" value={email} onChange={setEmail} required placeholder="name@kwali.gov.ng" />
            <Field label="Phone" value={phone} onChange={setPhone} placeholder="080…" />

            <div>
              <label className="text-sm font-semibold text-ink">Assigned ward</label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {wards.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <Field
              label="Initial password"
              type="text"
              value={password}
              onChange={setPassword}
              required
              placeholder="Minimum 8 characters"
            />

            <button
              type="submit"
              disabled={saving || !token}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Create {ROLE_META[role].label.toLowerCase()} account
            </button>
          </form>

          {/* One-time credential handover */}
          {issued && (
            <div className="mx-6 mb-6 rounded-xl border border-success/30 bg-success/10 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-success">
                <CheckCircle2 className="h-4 w-4" /> Account ready — hand over these credentials
              </div>
              <div className="mt-2 space-y-1 font-mono text-xs text-ink">
                <div>Name: {issued.name}</div>
                <div>Email: {issued.email}</div>
                <div>Password: {issued.password}</div>
              </div>
              <button
                onClick={copyCredentials}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
              >
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy credentials"}
              </button>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Shown once — store them somewhere safe or send them to the staff member now.
              </p>
            </div>
          )}
        </div>

        {/* Staff list */}
        <div className="surface-card lg:col-span-3">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-display text-base font-bold text-ink">Active staff</h2>
            <p className="text-xs text-muted-foreground">
              Every marshal and officer account on the platform
            </p>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading staff…
            </div>
          ) : staff.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm font-semibold text-ink">No staff accounts yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create the first marshal or officer account with the form.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {staff.map((s) => (
                <div key={s.id + s.role} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {s.fullName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-ink">{s.fullName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[s.phone, s.ward && `Ward ${s.ward}`].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <span
                    className={
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold " +
                      (s.role === "marshal"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-emerald-50 text-emerald-700")
                    }
                  >
                    {ROLE_META[s.role].icon}
                    {ROLE_META[s.role].label}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {s.createdAt.split("T")[0]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="surface-card flex items-center gap-4 p-5">
      <div className="rounded-xl bg-primary/8 p-2.5 text-primary">{icon}</div>
      <div>
        <div className="font-display text-2xl font-bold text-ink">{value}</div>
        <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-ink">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}
