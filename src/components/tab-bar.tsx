"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, Package, ShoppingBasket, Users } from "lucide-react";

const TABS = [
  { href: "/plan", label: "Plan", icon: CalendarDays, match: (p: string) => p === "/" || p.startsWith("/plan") },
  { href: "/list", label: "List", icon: ShoppingBasket, match: (p: string) => p.startsWith("/list") },
  { href: "/recipes", label: "Recipes", icon: BookOpen, match: (p: string) => p.startsWith("/recipes") },
  { href: "/pantry", label: "Pantry", icon: Package, match: (p: string) => p.startsWith("/pantry") },
  { href: "/household", label: "Household", icon: Users, match: (p: string) => p.startsWith("/household") },
] as const;

export function TabBar() {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/login") || pathname.startsWith("/share")) return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-(--border) bg-(--background)/92 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid h-(--tabbar-h) max-w-lg grid-cols-5">
        {TABS.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                  active ? "text-(--accent)" : "text-(--muted) hover:text-(--foreground)"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
