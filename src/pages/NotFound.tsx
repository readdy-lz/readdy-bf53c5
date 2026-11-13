import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background-50 text-center px-6">
      <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-background-100 text-foreground-300 mb-5">
        <i className="ri-chat-off-line text-[26px]"></i>
      </div>
      <h1 className="text-[22px] font-medium text-foreground-950">这个页面走丢了</h1>
      <p className="mt-2 text-[13px] text-foreground-500">链接可能已经失效，回到聊天继续吧</p>
      <Link
        to="/"
        className="mt-6 h-10 px-5 rounded-md bg-primary-500 text-background-50 text-[13px] font-medium whitespace-nowrap hover:bg-primary-600 transition-colors flex items-center"
      >
        回到聊天
      </Link>
    </div>
  );
}