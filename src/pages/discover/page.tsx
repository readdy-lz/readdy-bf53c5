import { useState } from "react";
import { discoverMenu } from "@/mocks/wechat";
import DiscoverMenu from "@/pages/discover/components/DiscoverMenu";
import DiscoverEntryList from "@/pages/discover/components/DiscoverEntryList";
import MomentsFeed from "@/pages/discover/components/MomentsFeed";

type DiscoverItem = { id: string; label: string; icon: string; badge?: string };

const placeholders: Record<string, string> = {
  channels: "视频号里可以刷到朋友点赞的短片，也能开一场自己的直播。",
  live: "直播会在这里展示关注主播的实时场次与回放。",
  scan: "扫一扫支持识别二维码、条码、书籍封面与街景。",
  shake: "摇一摇可以找到同一时刻在摇手机的人。",
  look: "看一看会推荐朋友正在阅读的文章。",
  search: "搜一搜可以检索聊天记录、公众号文章与小程序。",
  nearby: "附近会展示身边的人与线下活动。",
  mini: "小程序无需安装，扫码或用完即走。",
};

const isDesktopViewport = () =>
  typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;

export default function DiscoverPage() {
  const items = discoverMenu as DiscoverItem[];
  const [activeId, setActiveId] = useState<string | null>(() =>
    isDesktopViewport() ? "moments" : null,
  );

  const activeItem = items.find((item) => item.id === activeId);

  return (
    <div className="flex h-full w-full min-w-0 bg-background-100">
      <div className="hidden md:flex w-[300px] lg:w-[320px] shrink-0 flex-col h-full border-r border-background-200/80 bg-background-100">
        <div className="h-[52px] shrink-0 px-4 flex items-center">
          <h1 className="text-[15px] text-foreground-950">发现</h1>
        </div>
        <DiscoverMenu items={items} activeId={activeId ?? ""} onSelect={setActiveId} />
      </div>

      {activeId === null && (
        <div className="md:hidden flex-1 min-w-0 h-full flex flex-col bg-background-100">
          <header className="h-[52px] shrink-0 flex items-center justify-center bg-background-100 border-b border-background-200/70">
            <h1 className="text-[16px] text-foreground-950">发现</h1>
          </header>
          <div className="flex-1 overflow-y-auto wx-scroll pb-2">
            <DiscoverEntryList items={items} onSelect={setActiveId} />
          </div>
        </div>
      )}

      {activeId === null && (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-background-100">
          <span className="w-12 h-12 rounded-lg bg-background-200 text-foreground-400 flex items-center justify-center">
            <i className="ri-compass-3-line text-[24px]"></i>
          </span>
          <p className="mt-3 text-[12.5px] text-foreground-500">从左侧选择一个入口</p>
        </div>
      )}

      {activeId !== null && activeId === "moments" && (
        <div className="flex-1 min-w-0 h-full flex flex-col">
          <MomentsFeed onBack={() => setActiveId(null)} />
        </div>
      )}

      {activeId !== null && activeId !== "moments" && (
        <div className="flex-1 min-w-0 h-full flex flex-col">
          <header className="h-[52px] shrink-0 px-2 md:px-4 flex items-center gap-1 bg-background-100 border-b border-background-200/70">
            <button
              type="button"
              title="返回"
              onClick={() => setActiveId(null)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-foreground-800 hover:bg-background-200 cursor-pointer"
            >
              <i className="ri-arrow-left-s-line text-[22px]"></i>
            </button>
            <h2 className="text-[16px] text-foreground-950 truncate">{activeItem?.label}</h2>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center bg-background-100 px-6 text-center">
            <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-background-50 text-foreground-400 mb-4">
              <i className={`${activeItem?.icon || "ri-compass-3-line"} text-[28px]`}></i>
            </div>
            <h3 className="text-[15px] font-medium text-foreground-900">{activeItem?.label}</h3>
            <p className="mt-2 max-w-[360px] text-[12.5px] leading-relaxed text-foreground-500">
              {placeholders[activeId] || "该功能为演示占位，后续版本会补齐。"}
            </p>
            <button
              type="button"
              onClick={() => setActiveId("moments")}
              className="mt-5 h-9 px-4 rounded-md bg-primary-500 text-background-50 text-[12.5px] font-medium whitespace-nowrap hover:bg-primary-600 transition-colors cursor-pointer"
            >
              去看看朋友圈
            </button>
          </div>
        </div>
      )}
    </div>
  );
}