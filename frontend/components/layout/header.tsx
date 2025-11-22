"use client"

import { Bell, Search, AlertTriangle, Package, Truck, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

const mockNotifications = [
  {
    id: "1",
    type: "low_stock",
    title: "Low Stock Alert",
    message: "Widget Pro 2000 is below reorder point",
    time: "5 minutes ago",
    read: false,
    icon: AlertTriangle,
  },
  {
    id: "2",
    type: "receipt",
    title: "New Receipt Ready",
    message: "WH/IN/0001 is ready for validation",
    time: "1 hour ago",
    read: false,
    icon: Package,
  },
  {
    id: "3",
    type: "delivery",
    title: "Delivery Scheduled",
    message: "WH/OUT/0001 is scheduled for today",
    time: "2 hours ago",
    read: true,
    icon: Truck,
  },
  {
    id: "4",
    type: "completed",
    title: "Receipt Completed",
    message: "WH/IN/0002 has been validated",
    time: "3 hours ago",
    read: true,
    icon: CheckCircle2,
  },
]

export function Header() {
  const unreadCount = mockNotifications.filter((n) => !n.read).length

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4 w-1/3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search stock, moves, references..."
            className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 size-2 bg-destructive rounded-full border-2 border-card" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px]">
              {mockNotifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
              ) : (
                mockNotifications.map((notification) => {
                  const Icon = notification.icon
                  return (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 cursor-pointer ${!notification.read ? "bg-muted/50" : ""}`}
                    >
                      <div className={`mt-0.5 ${!notification.read ? "text-primary" : "text-muted-foreground"}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="size-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                      </div>
                    </DropdownMenuItem>
                  )
                })
              )}
            </ScrollArea>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center justify-center">View all notifications</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-8 w-px bg-border/50 mx-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 pl-2 pr-4 py-1.5 h-auto hover:bg-muted/50 rounded-full"
            >
              <Avatar className="size-8 border border-border">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-sm">
                <span className="font-medium">Admin User</span>
                <span className="text-xs text-muted-foreground">Manager</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
