"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ChevronDown, Heart, List, LogOut, PlusSquare, Scale, Settings, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";

/** Time-of-day greeting; empty until the browser has told us the local time, so server and client markup match. */
export function greetingFor(hour: number) {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "It's late night";
}

function subscribe(notify: () => void) {
  const id = window.setInterval(notify, 60_000);
  return () => window.clearInterval(id);
}
export function useGreeting() {
  return useSyncExternalStore(subscribe, () => greetingFor(new Date().getHours()), () => "");
}

export const firstName = (name?: string | null, email?: string | null) => (name?.trim().split(/\s+/)[0] || email?.split("@")[0] || "there");

const ITEMS = [
  { href: "/account/profile", label: "My profile", icon: User },
  { href: "/account/settings", label: "Account settings", icon: Settings },
  { href: "/account", label: "My listings", icon: List },
  { href: "/saved", label: "Saved homes", icon: Heart },
  { href: "/compare", label: "Compare homes", icon: Scale },
  { href: "/post", label: "Post a property", icon: PlusSquare },
] as const;

export function useSignOut() {
  const router = useRouter();
  return async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };
}

/** Top-right account chip: a greeting with the person's name, and a menu that opens on hover, focus or tap. */
export function AccountMenu() {
  const { data: session } = authClient.useSession();
  const greeting = useGreeting();
  const signOut = useSignOut();
  if (!session) return null;
  const name = firstName(session.user.name, session.user.email);

  return (
    <div className="group relative hidden sm:block">
      <button
        aria-haspopup="menu"
        className="flex h-11 cursor-pointer items-center gap-2.5 rounded-lg bg-white/10 py-0 pl-1.5 pr-3 text-left text-white transition-colors hover:bg-white/15"
      >
        <span aria-hidden className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#b6f400] text-[14px] font-semibold uppercase text-black">{name[0]}</span>
        <span className="hidden min-w-0 leading-[1.15] sm:block">
          <span className="block max-w-[150px] truncate text-[11px] text-white/70">{greeting || "Hello"},</span>
          <span className="mono-label block max-w-[150px] truncate">{name}</span>
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 opacity-70 transition-transform group-hover:rotate-180 group-focus-within:rotate-180 sm:block" />
      </button>
      <div className="invisible absolute right-0 top-full z-20 pt-3 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div role="menu" className="w-64 rounded-xl border border-white/10 bg-black/95 p-2 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/10 px-3 pb-3 pt-2">
            <p className="text-[13px] text-white/70">{greeting || "Hello"},</p>
            <p className="truncate text-[17px] font-medium text-white">{session.user.name || name}</p>
            <p className="truncate text-[12px] text-white/60">{session.user.email}</p>
          </div>
          <ul className="py-2">
            {ITEMS.map(({ href, label, icon: Icon }) => (
              <li key={href} role="none">
                <Link role="menuitem" href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-white/90 hover:bg-white/10 hover:text-white">
                  <Icon className="h-[18px] w-[18px] text-white/60" strokeWidth={1.6} /> {label}
                </Link>
              </li>
            ))}
          </ul>
          <button role="menuitem" onClick={signOut} className="flex w-full cursor-pointer items-center gap-3 rounded-lg border-t border-white/10 px-3 py-2.5 pt-3 text-left text-[15px] text-white/90 hover:bg-white/10 hover:text-white">
            <LogOut className="h-[18px] w-[18px] text-white/60" strokeWidth={1.6} /> Log out
          </button>
        </div>
      </div>
    </div>
  );
}
