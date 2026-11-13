import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/chat";

type ProfileRow = {
  name: string;
  avatar: string;
  wechat_id: string | null;
  region: string | null;
  signature: string | null;
  phone: string | null;
};

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  error: string;
  reload: () => void;
  updateSignature: (value: string) => Promise<boolean>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

const mapRow = (row: ProfileRow): Profile => ({
  name: row.name,
  avatar: row.avatar,
  wechatId: row.wechat_id ?? "",
  region: row.region ?? "",
  signature: row.signature ?? "",
  phone: row.phone ?? "",
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((prev) => prev + 1), []);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data, error: queryError } = await supabase
          .from("wx_profile")
          .select("name, avatar, wechat_id, region, signature, phone")
          .eq("id", 1)
          .maybeSingle();

        if (queryError) throw queryError;
        if (!alive) return;

        if (data) {
          setProfile(mapRow(data as ProfileRow));
        } else {
          setError("还没有找到个人资料");
        }
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "加载个人资料失败");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [tick]);

  const updateSignature = useCallback(async (value: string) => {
    const { error: updateError } = await supabase
      .from("wx_profile")
      .update({ signature: value })
      .eq("id", 1);

    if (updateError) return false;
    setProfile((prev) => (prev ? { ...prev, signature: value } : prev));
    return true;
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({ profile, loading, error, reload, updateSignature }),
    [profile, loading, error, reload, updateSignature],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used inside ProfileProvider");
  }
  return context;
}