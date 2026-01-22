import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  name: string;
  icon: string;
  path: string;
}

const navItems: NavItem[] = [
  { name: "Dashboard", icon: "📊", path: "/" },
  { name: "Teams", icon: "👥", path: "/teams" },
  { name: "Sponsors", icon: "🏷️", path: "/sponsors" },
  { name: "Settings", icon: "⚙️", path: "/settings" },
];

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b p-6">
            <h1 className="text-xl font-bold">Touchline Analytics</h1>
            <p className="text-sm text-muted-foreground">Sponsor Detection</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <Button variant="outline" className="w-full" size="sm">
              Help & Support
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
