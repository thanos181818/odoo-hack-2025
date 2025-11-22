"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Truck,
  Archive,
  History,
  Settings,
  LogOut,
  Bot,
  Boxes,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Stock", href: "/dashboard/stock", icon: Boxes },
  { name: "Receipts (In)", href: "/dashboard/receipts", icon: Archive },
  { name: "Deliveries (Out)", href: "/dashboard/deliveries", icon: Truck },
  { name: "Transfers", href: "/dashboard/transfers", icon: ArrowLeftRight },
  { name: "Products", href: "/dashboard/products", icon: Package },
  { name: "Move History", href: "/dashboard/moves", icon: History },
  { name: "AI Agents", href: "/dashboard/ai", icon: Bot },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full w-64 bg-card border-r border-border">
      <div className="p-6 flex items-center gap-2 border-b border-border/50">
        <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
          <Boxes className="size-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-xl tracking-tight">StockMaster</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Operations</div>
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.name}
            </Link>
          )
        })}

        <div className="mt-8 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
          System
        </div>
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
            pathname === "/dashboard/settings"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Settings className="size-4" />
          Settings
        </Link>
      </nav>

      <div className="p-4 border-t border-border/50">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="size-4" />
          Sign Out
        </Link>
      </div>
    </div>
  )
}
