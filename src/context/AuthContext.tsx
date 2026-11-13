import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export const DEMO_EMAIL = "demo@weliao.app";
export const DEMO_PASSWORD = "weliao2026";

type SignUpResult = { error: string | null; needsConfirm: boolean };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  expired: boolean;
  clearExpired: () => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signInDemo: () => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const friendly = (message: string) => {
  const value = message.toLowerCase();
  if (value.includes("invalid login credentials")) return "邮箱或密码不正确";
  if (value.includes("email not confirmed")) return "邮箱还没验证，请先到邮箱点击确认链接";
  if (value.includes("user already registered")) return "这个邮箱已经注册过了，直接登录就行";
  if (value.includes("password should be at least")) return "密码至少要 6 位";
  if (value.includes("unable to validate email")) return "邮箱格式看起来不太对";
  if (value.includes("rate limit") || value.includes("too many")) return "操作太频繁了，稍等一会儿再试";
  return message;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  const sessionRef = useRef<Session | null>(null);
  const manualSignOut = useRef(false);

  useEffect(() => {
    let alive = true;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        sessionRef.current = data.session ?? null;
        setSession(data.session ?? null);
      } finally {
        if (alive) setLoading(false);
      }
    };

    init();

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const hadSession = Boolean(sessionRef.current);
      sessionRef.current = nextSession ?? null;
      setSession(nextSession ?? null);
      setLoading(false);

      if (event === "SIGNED_OUT") {
        if (hadSession && !manualSignOut.current) setExpired(true);
        manualSignOut.current = false;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") setExpired(false);
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return friendly(error.message);
    return null;
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<SignUpResult> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) return { error: friendly(error.message), needsConfirm: false };
    return { error: null, needsConfirm: !data.session };
  }, []);

  const signInDemo = useCallback(async () => {
    try {
      await supabase.functions.invoke("ensure-demo-user", { body: { action: "demo" } });
    } catch {
      // 后端函数不可用时继续走常规登录/注册
    }

    const first = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    if (!first.error) return null;

    const created = await supabase.auth.signUp({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    if (created.error) return friendly(created.error.message);
    if (created.data.session) return null;

    const second = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    if (second.error) {
      return "演示账号还没激活，后端开启了邮箱验证，请先用邮箱注册一个账号";
    }
    return null;
  }, []);

  const signOut = useCallback(async () => {
    manualSignOut.current = true;
    setExpired(false);
    await supabase.auth.signOut();
  }, []);

  const clearExpired = useCallback(() => setExpired(false), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      expired,
      clearExpired,
      signIn,
      signUp,
      signInDemo,
      signOut,
    }),
    [session, loading, expired, clearExpired, signIn, signUp, signInDemo, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}