import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Moment, MomentComment } from "@/types/chat";

type MomentRow = {
  id: string;
  author: string;
  avatar: string;
  time_label: string | null;
  content: string | null;
  images: string[] | null;
  location: string | null;
  sort_order: number | null;
};

type LikeRow = { moment_id: string; name: string };
type CommentRow = { id: string; moment_id: string; name: string; content: string };

type PublishInput = {
  author: string;
  avatar: string;
  text: string;
  images: string[];
  location?: string;
};

export function useMoments() {
  const [moments, setMoments] = useState<Moment[]>([]);
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
        const [momentRes, likeRes, commentRes] = await Promise.all([
          supabase.from("wx_moments").select("*").order("sort_order", { ascending: true }),
          supabase.from("wx_moment_likes").select("moment_id, name"),
          supabase
            .from("wx_moment_comments")
            .select("id, moment_id, name, content")
            .order("created_at", { ascending: true }),
        ]);

        if (momentRes.error) throw momentRes.error;
        if (likeRes.error) throw likeRes.error;
        if (commentRes.error) throw commentRes.error;
        if (!alive) return;

        const likeMap = new Map<string, string[]>();
        ((likeRes.data as LikeRow[] | null) || []).forEach((row) => {
          const list = likeMap.get(row.moment_id) || [];
          list.push(row.name);
          likeMap.set(row.moment_id, list);
        });

        const commentMap = new Map<string, MomentComment[]>();
        ((commentRes.data as CommentRow[] | null) || []).forEach((row) => {
          const list = commentMap.get(row.moment_id) || [];
          list.push({ id: row.id, name: row.name, text: row.content });
          commentMap.set(row.moment_id, list);
        });

        setMoments(
          ((momentRes.data as MomentRow[] | null) || []).map((row) => ({
            id: row.id,
            author: row.author,
            avatar: row.avatar,
            time: row.time_label ?? "",
            text: row.content ?? "",
            images: row.images ?? [],
            location: row.location ?? undefined,
            likes: likeMap.get(row.id) || [],
            comments: commentMap.get(row.id) || [],
          })),
        );
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "加载朋友圈失败");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [tick]);

  const toggleLike = useCallback(async (momentId: string, name: string) => {
    let removing = false;

    setMoments((prev) =>
      prev.map((moment) => {
        if (moment.id !== momentId) return moment;
        const liked = moment.likes.includes(name);
        removing = liked;
        return {
          ...moment,
          likes: liked ? moment.likes.filter((item) => item !== name) : [...moment.likes, name],
        };
      }),
    );

    try {
      if (removing) {
        const { error: deleteError } = await supabase
          .from("wx_moment_likes")
          .delete()
          .eq("moment_id", momentId)
          .eq("name", name);
        if (deleteError) throw deleteError;
      } else {
        const { error: insertError } = await supabase
          .from("wx_moment_likes")
          .insert({ moment_id: momentId, name });
        if (insertError && insertError.code !== "23505") throw insertError;
      }
    } catch {
      setError("点赞操作没有同步成功");
    }
  }, []);

  const addComment = useCallback(async (momentId: string, name: string, text: string) => {
    const value = text.trim();
    if (!value) return false;

    const id = `mc-${Date.now()}-${Math.round(Math.random() * 9999)}`;

    setMoments((prev) =>
      prev.map((moment) =>
        moment.id === momentId
          ? { ...moment, comments: [...moment.comments, { id, name, text: value }] }
          : moment,
      ),
    );

    try {
      const { error: insertError } = await supabase
        .from("wx_moment_comments")
        .insert({ id, moment_id: momentId, name, content: value });

      if (insertError) throw insertError;
      return true;
    } catch {
      setError("评论没有发送成功");
      setMoments((prev) =>
        prev.map((moment) =>
          moment.id === momentId
            ? { ...moment, comments: moment.comments.filter((item) => item.id !== id) }
            : moment,
        ),
      );
      return false;
    }
  }, []);

  const publishMoment = useCallback(
    async (input: PublishInput) => {
      const id = `m-${Date.now()}-${Math.round(Math.random() * 9999)}`;
      try {
        const { error: insertError } = await supabase.from("wx_moments").insert({
          id,
          author: input.author,
          avatar: input.avatar,
          time_label: "刚刚",
          content: input.text,
          images: input.images,
          location: input.location ?? null,
          sort_order: -Math.floor(Date.now() / 1000),
        });

        if (insertError) throw insertError;
        reload();
        return true;
      } catch {
        return false;
      }
    },
    [reload],
  );

  return { moments, loading, error, reload, toggleLike, addComment, publishMoment };
}