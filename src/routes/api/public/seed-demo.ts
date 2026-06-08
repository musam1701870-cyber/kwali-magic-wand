import { createFileRoute } from "@tanstack/react-router";

const DEMO_PASSWORD = "Kwali2026!";

const DEMO_USERS = [
  { email: "admin@kwali.demo",    full_name: "Aisha Bello",   phone: "08030000001", ward: "Kwali",   role: "admin"    as const },
  { email: "officer@kwali.demo",  full_name: "Tunde Okafor",  phone: "08030000002", ward: "Yangoji", role: "officer"  as const },
  { email: "taxpayer@kwali.demo", full_name: "Grace Adamu",   phone: "08030000003", ward: "Dafa",    role: "taxpayer" as const },
];

const SAMPLE_BUSINESSES = [
  { business_name: "Adamu Grocery Stores",   category: "Retail / General Merchandise", ward: "Dafa",    annual_rate: 25000,  status: "Active",  obligations: ["Business Premises", "Sanitation"] },
  { business_name: "Kwali Quick POS",        category: "POS Operator / Agent Banking", ward: "Kwali",   annual_rate: 15000,  status: "Pending", obligations: ["Business Premises"] },
  { business_name: "Grace Hotel & Suites",   category: "Hotel / Lodge / Guest House",  ward: "Yangoji", annual_rate: 120000, status: "Active",  obligations: ["Business Premises", "Hospitality Levy"] },
];

export const Route = createFileRoute("/api/public/seed-demo")({
  server: {
    handlers: {
      GET: () => handle(),
      POST: () => handle(),
    },
  },
});

async function handle() {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const created: Array<{ email: string; role: string; password: string; status: string }> = [];

    // Page through existing users
    const existingByEmail = new Map<string, string>();
    let page = 1;
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      for (const u of data.users) if (u.email) existingByEmail.set(u.email.toLowerCase(), u.id);
      if (data.users.length < 200) break;
      page += 1;
    }

    for (const u of DEMO_USERS) {
      let userId = existingByEmail.get(u.email);
      let status = "exists";
      if (!userId) {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: u.full_name, phone: u.phone, ward: u.ward },
        });
        if (error || !data.user) throw error ?? new Error("createUser returned no user");
        userId = data.user.id;
        status = "created";
      } else {
        // Reset password so the printed credentials always work.
        await supabaseAdmin.auth.admin.updateUserById(userId, { password: DEMO_PASSWORD, email_confirm: true });
      }

      // Ensure profile row (trigger creates it on insert; safety upsert for pre-existing users).
      await supabaseAdmin.from("profiles").upsert({
        id: userId, full_name: u.full_name, phone: u.phone, ward: u.ward,
      });

      // Ensure correct role. The new-user trigger gives every user 'taxpayer';
      // add admin/officer for the non-taxpayer demos.
      if (u.role !== "taxpayer") {
        const { data: existingRoles } = await supabaseAdmin
          .from("user_roles").select("role").eq("user_id", userId);
        const has = (existingRoles ?? []).some((r) => r.role === u.role);
        if (!has) {
          await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: u.role });
        }
      }

      // Seed businesses for the taxpayer demo account only.
      if (u.role === "taxpayer") {
        const { count } = await supabaseAdmin
          .from("businesses").select("id", { count: "exact", head: true }).eq("owner_id", userId);
        if (!count) {
          const rows = SAMPLE_BUSINESSES.map((b, i) => ({
            owner_id: userId!,
            ref: `KWL-BIZ-2026-${String(1000 + i).padStart(4, "0")}`,
            business_name: b.business_name,
            category: b.category,
            ward: b.ward,
            annual_rate: b.annual_rate,
            status: b.status,
            obligations: b.obligations,
            owner_name: u.full_name,
            phone: u.phone,
            email: u.email,
          }));
          await supabaseAdmin.from("businesses").insert(rows);
        }
      }

      created.push({ email: u.email, role: u.role, password: DEMO_PASSWORD, status });
    }

    return new Response(JSON.stringify({ ok: true, accounts: created }, null, 2), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Seed failed";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500, headers: { "content-type": "application/json" },
    });
  }
}