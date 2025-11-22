import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockStockMoves, mockProducts } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export function RecentMoves() {
  const recentMoves = mockStockMoves.slice(0, 5)

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {recentMoves.map((move) => {
            const product = mockProducts.find((p) => p.id === move.productId)
            return (
              <div key={move.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarFallback
                    className={cn(
                      "text-xs font-bold",
                      move.type === "RECEIPT"
                        ? "bg-success/10 text-success"
                        : move.type === "DELIVERY"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-accent/10 text-accent",
                    )}
                  >
                    {move.type.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{product?.name || "Unknown Product"}</p>
                  <p className="text-xs text-muted-foreground">
                    {move.reference} • {move.type}
                  </p>
                </div>
                <div
                  className={cn(
                    "ml-auto font-medium text-sm",
                    move.type === "RECEIPT"
                      ? "text-success"
                      : move.type === "DELIVERY"
                        ? "text-destructive"
                        : "text-foreground",
                  )}
                >
                  {move.type === "DELIVERY" ? "-" : "+"}
                  {Math.abs(move.qty)}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
