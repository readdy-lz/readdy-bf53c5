import type { RouteObject } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import AppLayout from "@/pages/app/layout";
import AuthPage from "@/pages/auth/page";
import RequireAuth from "@/components/feature/RequireAuth";
import ChatPage from "@/pages/chat/page";
import ContactsPage from "@/pages/contacts/page";
import DiscoverPage from "@/pages/discover/page";
import MePage from "@/pages/me/page";

const routes: RouteObject[] = [
  { path: "/login", element: <AuthPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <ChatPage /> },
      { path: "contacts", element: <ContactsPage /> },
      { path: "discover", element: <DiscoverPage /> },
      { path: "me", element: <MePage /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;