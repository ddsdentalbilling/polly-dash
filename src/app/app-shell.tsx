"use client";

import { usePathname, useRouter } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}

function Sidebar() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="w-64 border-r border-border bg-card p-4 flex flex-col gap-6">
      <div className="flex items-center gap-2 px-2">
        <span className="text-2xl">🦜</span>
        <div>
          <h1 className="text-lg font-bold">Polly-Dash</h1>
          <p className="text-xs text-muted-foreground">DDS Command Center</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        <NavItem href="/" label="Dashboard" icon="📊" />
        <NavItem href="/departments" label="Departments" icon="🏢" />
        <NavItem href="/departments/operations" label="Operations" icon="📋" indent />
        <NavItem href="/departments/it" label="IT" icon="💻" indent />
        <NavItem href="/departments/finance" label="Finance" icon="💰" indent />
        <NavItem href="/departments/hr" label="HR" icon="👥" indent />
        <NavItem href="/departments/marketing-sales" label="Marketing & Sales" icon="📢" indent />
      </nav>
      <div className="mt-auto px-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full"
        >
          <span>🚪</span>
          Sign Out
        </button>
        <p className="text-xs text-muted-foreground mt-2 px-3">Polly-Dash v0.1.0</p>
      </div>
    </aside>
  );
}

function NavItem({ href, label, icon, indent }: { href: string; label: string; icon: string; indent?: boolean }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${indent ? "ml-4" : "font-medium"}`}
    >
      <span>{icon}</span>
      {label}
    </a>
  );
}
