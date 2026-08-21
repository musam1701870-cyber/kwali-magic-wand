import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Staff account management — admin only.
//
// Unlike public self-registration, marshal and officer accounts are created by
// an administrator: the council decides who carries enforcement authority, so
// there is deliberately no self-signup path for staff roles.
//
// The caller's Supabase access token travels inside the validated payload:
// client-side server-function calls do not attach the session token to request
// headers, so the payload is the one channel we control end to end. Every
// function verifies that token and checks the admin role server-side — the
// service-role client bypasses RLS, so this check is the only thing standing
// between the internet and account creation.

const STAFF_ROLES = ["marshal", "officer"] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

/** Verify the caller's access token and return their user id, or throw. */
async function callerUserId(token: string): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.getClaims(token);
  if (error || !data?.claims?.sub) throw new Error("Unauthorized: sign in again and retry");
  return data.claims.sub;
}

/** Throw unless the given user holds the admin role. */
async function assertAdmin(userId: string): Promise<void> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: staff accounts are managed by administrators only");
}

const callerToken = {
  // Supabase access token of the signed-in admin calling this function.
  callerToken: z.string().min(20, "Missing caller session"),
};

const CreateStaffSchema = z.object({
  ...callerToken,
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("A valid email is required"),
  phone: z.string().optional(),
  ward: z.string().optional(),
  role: z.enum(STAFF_ROLES),
  // The admin sets an initial password; the officer/marshal changes it after
  // first login. Minimum length matches Supabase's own default.
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type StaffAccount = {
  id: string;
  fullName: string;
  phone: string | null;
  ward: string | null;
  role: StaffRole;
  createdAt: string;
};

export const createStaffAccount = createServerFn({ method: "POST" })
  .validator(CreateStaffSchema)
  .handler(async ({ data }): Promise<StaffAccount> => {
    const callerId = await callerUserId(data.callerToken);
    await assertAdmin(callerId);

    // One account per phone number across the whole platform.
    if (data.phone) {
      const phoneDigits = data.phone.replace(/[^0-9]/g, "");
      if (phoneDigits.length >= 7) {
        const { data: phoneRows } = await supabaseAdmin
          .from("profiles")
          .select("id, phone")
          .not("phone", "is", null);
        const taken = (phoneRows ?? []).some(
          (p) => typeof p.phone === "string" && p.phone.replace(/[^0-9]/g, "").endsWith(phoneDigits.slice(-7)),
        );
        if (taken) {
          throw new Error("This phone number is already registered to another account. Please use a different phone number.");
        }
      }
    }

    // 1. Create the auth user. email_confirm skips the verification email —
    //    the admin vouches for the account by creating it.
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName, phone: data.phone ?? "", ward: data.ward ?? "" },
    });
    if (createError || !created.user) {
      throw new Error(createError?.message ?? "Could not create the account");
    }
    const userId = created.user.id;

    // The handle_new_user trigger already inserted a profiles row and the
    // default 'taxpayer' role; upgrade both to the staff reality.
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.fullName, phone: data.phone ?? null, ward: data.ward ?? null })
      .eq("id", userId);
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(profileError.message);
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: data.role }, { onConflict: "user_id,role" });
    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(roleError.message);
    }

    return {
      id: userId,
      fullName: data.fullName,
      phone: data.phone ?? null,
      ward: data.ward ?? null,
      role: data.role,
      createdAt: new Date().toISOString(),
    };
  });

/** List every marshal and officer account, newest first (admin only). */
export const fetchStaffAccounts = createServerFn({ method: "POST" })
  .validator(z.object(callerToken))
  .handler(async ({ data }): Promise<StaffAccount[]> => {
    const callerId = await callerUserId(data.callerToken);
    await assertAdmin(callerId);

    const { data: roleRows, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role, created_at")
      .in("role", [...STAFF_ROLES])
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    if (!roleRows?.length) return [];

    const ids = [...new Set(roleRows.map((r) => r.user_id as string))];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, ward")
      .in("id", ids);
    const byId = new Map((profiles ?? []).map((p) => [p.id as string, p]));

    return roleRows.map((r) => {
      const p = byId.get(r.user_id as string);
      return {
        id: r.user_id as string,
        fullName: (p?.full_name as string) || "Unnamed",
        phone: (p?.phone as string) ?? null,
        ward: (p?.ward as string) ?? null,
        role: r.role as StaffRole,
        createdAt: r.created_at as string,
      };
    });
  });
