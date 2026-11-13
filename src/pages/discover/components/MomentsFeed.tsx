import { useState } from "react";
import { momentsCover } from "@/mocks/wechat";
import { useMoments } from "@/hooks/useMoments";
import { useProfile } from "@/context/ProfileContext";
import CommentsBlock from "@/pages/discover/components/CommentsBlock";
import MomentsComposer from "@/pages/discover/components/MomentsComposer";

type MomentsFeedProps = {
  onBack: () => void;
};

export default function MomentsFeed({ onBack }: MomentsFeedProps) {
  const { profile } = useProfile();
  const { moments, loading, error, reload, toggleLike, addComment, publishMoment } = useMoments();
  const [draftFor, setDraftFor] = useState("");
  const [draft, setDraft] = useState("");
  const [actionFor, setActionFor] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  const myName = profile?.name || "我";

  const handlePublish = async (input: { text: string; images: string[]; location?: string }) =>
    publishMoment({ ...input, author: myName, avatar: profile?.avatar || "" });

  const submitComment = async (id: string) => {
    const value = draft.trim();
    if (!value) return;
    const ok = await addComment(id, myName, value);
    if (ok) {
      setDraft("");
      setDraftFor("");
    }
  };

  return (
    <>
    <div
      className="flex-1 min-h-0 overflow-y-auto wx-scroll bg-background-100"
      onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 96)}
    >
      <div className="mx-auto max-w-[680px] min-h-full bg-background-50 pb-14">
        <div
          className={`sticky top-0 z-30 -mb-11 h-11 flex items-center gap-1 px-1.5 transition-colors duration-200 ${
            scrolled
              ? "bg-background-100/95 backdrop-blur border-b border-background-200/70"
              : "bg-gradient-to-b from-background-950/45 to-transparent"
          }`}
        >
          <button
            type="button"
            title="返回发现"
            onClick={onBack}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              scrolled
                ? "text-foreground-900 hover:bg-background-200"
                : "text-background-50 hover:bg-background-50/20"
            }`}
          >
            <i className="ri-arrow-left-s-line text-[23px]"></i>
          </button>
          <h2
            className={`text-[15.5px] font-medium ${
              scrolled ? "text-foreground-950" : "text-background-50"
            }`}
          >
            朋友圈
          </h2>
          <button
            type="button"
            title="发表动态"
            onClick={() => setComposerOpen(true)}
            className={`ml-auto w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              scrolled
                ? "text-foreground-800 hover:bg-background-200"
                : "text-background-50 hover:bg-background-50/20"
            }`}
          >
            <i className="ri-camera-line text-[19px]"></i>
          </button>
        </div>

        <div className="relative">
          <div className="w-full h-[240px] md:h-[290px] overflow-hidden bg-background-300">
            <img
              src={momentsCover}
              alt="朋友圈封面"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background-950/30 to-transparent"></div>
          <div className="absolute right-4 -bottom-6 flex items-end gap-3">
            <span className="mb-8 text-[15px] text-background-50">{myName}</span>
            <img
              src={profile?.avatar || ""}
              alt={myName}
              className="w-[60px] h-[60px] rounded-md object-cover border-2 border-background-50"
            />
          </div>
        </div>

        <div className="pt-11">
          {loading && (
            <div className="px-4 py-4 space-y-5 animate-pulse">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex gap-2.5">
                  <div className="w-10 h-10 rounded-md bg-background-200 shrink-0"></div>
                  <div className="flex-1 space-y-2.5">
                    <div className="h-3 w-24 rounded bg-background-200"></div>
                    <div className="h-3 w-full rounded bg-background-200"></div>
                    <div className="h-3 w-2/3 rounded bg-background-200"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="py-14 flex flex-col items-center text-center">
              <div className="w-12 h-12 flex items-center justify-center rounded-md bg-accent-100 text-accent-700 mb-3">
                <i className="ri-error-warning-line text-[22px]"></i>
              </div>
              <p className="text-[12.5px] text-foreground-600 leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={reload}
                className="mt-3 h-8 px-3.5 rounded-md bg-primary-500 text-background-50 text-[12px] whitespace-nowrap hover:bg-primary-600 transition-colors cursor-pointer"
              >
                重新加载
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            moments.map((moment) => {
              const isLiked = moment.likes.includes(myName);
              const images = moment.images || [];
              const isSingle = images.length === 1;

              return (
                <article
                  key={moment.id}
                  className="wx-fade-up flex gap-2.5 px-3.5 py-4 border-b border-background-200/70 last:border-b-0"
                >
                  <img
                    src={moment.avatar}
                    alt={moment.author}
                    className="w-10 h-10 rounded-[4px] object-cover shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="wx-link-name text-[14px] leading-none pt-0.5">{moment.author}</h3>

                    <p className="text-[14px] leading-[1.62] text-foreground-900 mt-2 whitespace-pre-line break-words">
                      {moment.text}
                    </p>

                    {images.length > 0 && (
                      <div className="mt-2">
                        {isSingle ? (
                          <div className="w-[188px] h-[188px] sm:w-[210px] sm:h-[210px] rounded-[3px] overflow-hidden bg-background-200">
                            <img
                              src={images[0]}
                              alt="动态图片"
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-[3px] w-full max-w-[290px]">
                            {images.slice(0, 9).map((image, index) => (
                              <div
                                key={`${moment.id}-img-${index}`}
                                className="aspect-square rounded-[3px] overflow-hidden bg-background-200"
                              >
                                <img
                                  src={image}
                                  alt="动态图片"
                                  className="w-full h-full object-cover object-top"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[11.5px] text-foreground-400">{moment.time}</span>
                      {moment.location && (
                        <>
                          <span className="w-0.5 h-0.5 rounded-full bg-foreground-300"></span>
                          <span className="wx-link-name text-[11.5px] truncate max-w-[150px]">
                            {moment.location}
                          </span>
                        </>
                      )}

                      <div className="ml-auto relative shrink-0">
                        <button
                          type="button"
                          title="赞和评论"
                          onClick={() => setActionFor(actionFor === moment.id ? "" : moment.id)}
                          className="w-7 h-[22px] flex items-center justify-center rounded-[3px] bg-background-100 text-foreground-500 hover:bg-background-200 active:bg-background-300 transition-colors cursor-pointer"
                        >
                          <i className="ri-more-fill text-[16px]"></i>
                        </button>

                        {actionFor === moment.id && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setActionFor("")}
                              aria-hidden="true"
                            ></div>
                            <div className="wx-pop-in absolute right-0 top-full mt-1 z-40 flex items-center rounded-md bg-foreground-800 text-background-50 overflow-hidden shadow-none">
                              <button
                                type="button"
                                onClick={() => {
                                  toggleLike(moment.id, myName);
                                  setActionFor("");
                                }}
                                className="h-8 px-3.5 flex items-center gap-1 text-[12px] whitespace-nowrap hover:bg-foreground-900 cursor-pointer"
                              >
                                <i
                                  className={`${
                                    isLiked ? "ri-heart-3-fill" : "ri-heart-3-line"
                                  } text-[13px]`}
                                ></i>
                                {isLiked ? "取消" : "赞"}
                              </button>
                              <span className="w-px h-4 bg-background-50/25"></span>
                              <button
                                type="button"
                                onClick={() => {
                                  setDraftFor(moment.id);
                                  setDraft("");
                                  setActionFor("");
                                }}
                                className="h-8 px-3.5 flex items-center gap-1 text-[12px] whitespace-nowrap hover:bg-foreground-900 cursor-pointer"
                              >
                                <i className="ri-chat-1-line text-[13px]"></i>
                                评论
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <CommentsBlock likes={moment.likes} comments={moment.comments} />

                    {draftFor === moment.id && (
                      <div className="wx-pop-in mt-2 flex items-center gap-2">
                        <input
                          value={draft}
                          onChange={(event) => setDraft(event.target.value.slice(0, 200))}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") submitComment(moment.id);
                          }}
                          placeholder="评论"
                          className="flex-1 min-w-0 h-8 px-2.5 rounded-[4px] bg-background-100 border border-background-200 text-sm text-foreground-900 outline-none focus:border-primary-300 placeholder:text-foreground-400"
                        />
                        <button
                          type="button"
                          onClick={() => submitComment(moment.id)}
                          disabled={!draft.trim()}
                          className={`h-8 px-3 rounded-[4px] text-[12px] whitespace-nowrap transition-colors ${
                            draft.trim()
                              ? "bg-primary-500 text-background-50 hover:bg-primary-600 cursor-pointer"
                              : "bg-background-200 text-foreground-400 cursor-not-allowed"
                          }`}
                        >
                          发送
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}

          {!loading && !error && moments.length === 0 && (
            <p className="py-14 text-center text-[12.5px] text-foreground-500">还没有人发动态</p>
          )}
        </div>
      </div>
    </div>
    {composerOpen && (
      <MomentsComposer onClose={() => setComposerOpen(false)} onPublish={handlePublish} />
    )}
    </>
  );
}