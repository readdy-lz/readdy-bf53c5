import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Contact } from "@/types/chat";

type ContactRow = {
  id: string;
  name: string;
  avatar: string;
  wechat_id: string | null;
  region: string | null;
  signature: string | null;
  letter: string | null;
  conversation_id: string | null;
  is_starred: boolean | null;
  common_groups: string[] | null;
  sort_order: number | null;
};

const mapContact = (row: ContactRow): Contact => ({
  id: row.id,
  name: row.name,
  avatar: row.avatar,
  wechatId: row.wechat_id ?? "",
  region: row.region ?? "",
  signature: row.signature ?? "",
  letter: (row.letter ?? "#").toUpperCase(),
  conversationId: row.conversation_id ?? undefined,
  isStarred: Boolean(row.is_starred),
  commonGroups: row.common_groups ?? [],
});

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
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
          .from("wx_contacts")
          .select("*")
          .order("sort_order", { ascending: true });

        if (queryError) throw queryError;
        if (!alive) return;

        setContacts(((data as ContactRow[] | null) || []).map(mapContact));
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "加载通讯录失败");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [tick]);

  return { contacts, loading, error, reload };
}