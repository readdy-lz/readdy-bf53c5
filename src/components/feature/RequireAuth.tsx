import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-50">
        <div className="flex flex-col items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-primary-500 text-background-50 flex items-center justify-center">
            <i className="ri-chat-smile-2-line text-[21px]"></i>
          </span>
          <p className="text-[12.5px] text-foreground-500">正在检查登录状态…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}