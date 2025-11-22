import type React from "react"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string | number
  description?: string
  trend?: number
  icon?: React.ElementType
  trendLabel?: string
}

export function KPICard({ title, value, description, trend, icon: Icon, trendLabel }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend !== undefined && (
          <div
            className={cn(
              "flex items-center text-xs font-medium mt-2",
              trend > 0 ? "text-success" : trend < 0 ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {trend > 0 ? (
              <ArrowUpRight className="size-3 mr-1" />
            ) : trend < 0 ? (
              <ArrowDownRight className="size-3 mr-1" />
            ) : (
              <Minus className="size-3 mr-1" />
            )}
            {Math.abs(trend)}%{trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
