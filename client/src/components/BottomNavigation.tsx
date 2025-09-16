import { Button } from "@/components/ui/button";
import { Dumbbell, Calendar, BarChart3, Settings } from "lucide-react";
import { useLocation } from "wouter";

interface NavItem {
  icon: typeof Dumbbell;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Dumbbell, label: "Equipment", path: "/equipment" },
  { icon: Calendar, label: "Plan", path: "/plan" },
  { icon: BarChart3, label: "Progress", path: "/progress" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function BottomNavigation() {
  const [location, navigate] = useLocation();

  const handleNavigate = (path: string) => {
    console.log("Navigate to:", path);
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex items-center justify-around p-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => handleNavigate(item.path)}
              data-testid={`button-nav-${item.label.toLowerCase()}`}
              className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}