
import * as Icons from "lucide-react";

export function getLucideIcon(iconName: string) {
    const pascal = iconName
      .split("-")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join("");
  
    return (Icons as any)[pascal] || Icons.Tag;
  }
  