import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "chairman" | "taxpayer" | "officer" | "marshal";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  roles: Role[];
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  roles: [],
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Track which user ID we last fetched roles for so we never blank
  // the roles array during a token refresh for the *same* user.
  const lastUidRef = useRef<string | null>(null);
  // Guard against the race where onAuthStateChange fires before
  // getSession resolves — only let one of them drive the initial load.
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    /** Fetch roles for a user and update state.
     *  - If the uid hasn't changed we keep existing roles visible while
     *    the refresh happens in the background (no flicker).
     *  - Returns a boolean so callers can gate `setLoading(false)`.
     */
    // `async` so callers get a real Promise: the Supabase query builder is only
    // PromiseLike (no .finally), which the callers below rely on.
    const fetchRoles = async (uid: string) => {
      const isSameUser = lastUidRef.current === uid;
      lastUidRef.current = uid;

      // Don't blank roles while we re-fetch for the same user —
      // this is what caused the redirect loop on token refresh.
      // For a brand-new user (login / account switch) we do clear.
      if (!isSameUser) setRoles([]);

      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      setRoles((data ?? []).map((r) => r.role as Role));
    };

    // 1️⃣  getSession — authoritative for the first paint.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchRoles(data.session.user.id).finally(() => {
          initialLoadDoneRef.current = true;
          setLoading(false);
        });
      } else {
        lastUidRef.current = null;
        initialLoadDoneRef.current = true;
        setLoading(false);
      }
    });

    // 2️⃣  onAuthStateChange — keeps things in sync after the first paint.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        fetchRoles(s.user.id).finally(() => {
          // In case getSession was slow and this fires first.
          if (!initialLoadDoneRef.current) {
            initialLoadDoneRef.current = true;
            setLoading(false);
          }
        });
      } else {
        // Signed out — clear everything.
        lastUidRef.current = null;
        setRoles([]);
        if (!initialLoadDoneRef.current) {
          initialLoadDoneRef.current = true;
        }
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthCtx = {
    user: session?.user ?? null,
    session,
    roles,
    loading,
    isAdmin: roles.includes("admin"),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
