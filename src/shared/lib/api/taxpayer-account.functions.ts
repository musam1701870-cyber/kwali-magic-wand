import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Create a taxpayer account on behalf of someone else.
//
// Two callers use this:
//   * staff (marshal/officer/admin) registering a taxpayer at the office — the
//     staff member's session must NOT be disturbed, so the account is created
//     via the service role here, never via supabase.auth.signUp() on the client
//     (which would sign the staff member out and into the new account).
//   * a self-service member of the public who already filled the form — same
//     path, so the public flow and the assisted flow create identical accounts.

const CreateTaxpayerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  ward: z.string().optional(),
  nin: z.string().optional(),
  accountType: z.string().optional(),
});

export const createTaxpayerAccount = createServerFn({ method: "POST" })
  .validator(CreateTaxpayerSchema)
  .handler(async ({ data }) => {
    // NIN doubles as the default password when present (matches the historical
    // behaviour of the public wizard); otherwise a random one is generated and
    // shown once to whoever completed the registration.
    const password = data.nin && data.nin.length >= 6 ? data.nin : `Kwali${Date.now()}`;

    // One account per email. If the address is already registered the caller
    // must use a different email — we never silently reuse the existing account.
    const existing = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    const found = existing.data?.users?.find(
      (u) => u.email?.toLowerCase() === data.email.toLowerCase(),
    );
    if (found) {
      throw new Error("This email is already registered. Please use a different email address.");
    }

    // One account per phone number. Two taxpayer accounts cannot share a phone.
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

    // email_confirm: false so Supabase sends a real confirmation email — the
    // account stays unconfirmed until the taxpayer clicks the link.
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password,
      email_confirm: false,
      user_metadata: {
        full_name: data.fullName,
        phone: data.phone ?? "",
        ward: data.ward ?? "",
        account_type: data.accountType ?? "taxpayer",
      },
    });
    if (error || !created.user) {
      throw new Error(error?.message ?? "Could not create the taxpayer account");
    }

    // Send the verification email. generateLink with type "signup" produces the
    // confirmation link; Supabase emails it to the address. The link redirects
    // back to the app's login page once clicked.
    let emailSent = true;
    try {
      const origin = process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? "";
      await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email: data.email,
        password,
        options: origin ? { redirectTo: `${origin.replace(/\/$/, "")}/auth/login` } : undefined,
      });
    } catch {
      // A failed email must not roll back the account — the taxpayer can use
      // "forgot password" on the login page to get a fresh link any time.
      emailSent = false;
    }

    // The handle_new_user trigger already creates the profile + taxpayer role.
    await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.fullName, phone: data.phone ?? null, ward: data.ward ?? null })
      .eq("id", created.user.id);

    return { ok: true, userId: created.user.id, existed: false, password, emailSent };
  });
