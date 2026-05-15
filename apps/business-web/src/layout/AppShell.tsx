import {
  Bell,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Search,
  Store,
  UtensilsCrossed,
  UsersRound,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useCurrentUserQuery, useLogoutMutation } from "@/features/auth/authQueries";
import { cn } from "@/lib/utils";

const navigationItems = [
  { to: "/", label: "대시보드", icon: LayoutDashboard },
  { to: "/onboarding", label: "입점 신청", icon: ClipboardList },
  { to: "/reservations", label: "예약 운영", icon: CalendarClock },
  { to: "/store", label: "매장 설정", icon: Store },
  { to: "/customers", label: "고객 관리", icon: UsersRound },
];

export function AppShell() {
  const navigate = useNavigate();
  const currentUser = useCurrentUserQuery();
  const logout = useLogoutMutation();

  async function handleLogout() {
    try {
      await logout.mutateAsync();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[252px_1fr]">
        <aside className="border-border bg-card/95 px-5 py-4 shadow-sm lg:border-r">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <UtensilsCrossed aria-hidden className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">예약 운영</p>
              <p className="truncate text-xs text-muted-foreground">사업자 콘솔</p>
            </div>
          </div>

          <nav className="mt-7 grid gap-1 text-sm" aria-label="주요 메뉴">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  className={({ isActive }) =>
                    cn(
                      "flex h-10 items-center gap-3 rounded-md px-3 transition",
                      isActive
                        ? "bg-secondary font-medium text-secondary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )
                  }
                  end={item.to === "/"}
                  key={item.to}
                  to={item.to}
                >
                  <Icon aria-hidden className="size-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          <header className="flex flex-col gap-3 border-b border-border bg-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-8">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">청담 본점</p>
              <p className="truncate text-base font-semibold">
                {currentUser.data?.displayName ?? "사업자"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex size-10 items-center justify-center rounded-md border border-input bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground"
                type="button"
                aria-label="검색"
              >
                <Search aria-hidden className="size-4" />
              </button>
              <button
                className="flex size-10 items-center justify-center rounded-md border border-input bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground"
                type="button"
                aria-label="알림"
              >
                <Bell aria-hidden className="size-4" />
              </button>
              <button
                className="flex h-10 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm font-medium transition hover:bg-muted"
                type="button"
              >
                매장 선택
                <ChevronDown aria-hidden className="size-4 text-muted-foreground" />
              </button>
              <button
                className="flex size-10 items-center justify-center rounded-md border border-input bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground"
                type="button"
                aria-label="로그아웃"
                onClick={handleLogout}
                disabled={logout.isPending}
              >
                <LogOut aria-hidden className="size-4" />
              </button>
            </div>
          </header>

          <main className="min-w-0 px-5 py-5 sm:px-7 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
