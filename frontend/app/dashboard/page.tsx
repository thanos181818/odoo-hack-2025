"use client"

import { useRouter } from "next/navigation"
import { Archive, Truck, AlertTriangle, Package, Activity, Sparkles, FileDown } from "lucide-react"
import { KPICard } from "@/components/dashboard/kpi-card"
import { OverviewChart } from "@/components/dashboard/overview-chart"
import { RecentMoves } from "@/components/dashboard/recent-moves"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mockReceipts, mockDeliveries, mockStockQuants, mockProducts } from "@/lib/mock-data"

export default function DashboardPage() {
  const router = useRouter()

  const handleDownloadReport = () => {
    const pendingReceipts = mockReceipts.filter((r) => r.status !== "DONE").length
    const pendingDeliveries = mockDeliveries.filter((d) => d.status !== "DONE").length
    const lowStockItems = mockStockQuants.filter((q) => {
      const product = mockProducts.find((p) => p.id === q.productId)
      const available = q.quantity - q.reserved
      return product?.reorderQty ? available <= product.reorderQty : false
    }).length
    const totalProducts = mockProducts.length

    const reportData = [
      ["Dashboard Summary Report"],
      ["Generated:", new Date().toLocaleString()],
      [""],
      ["KPI Metrics"],
      ["Pending Receipts", pendingReceipts],
      ["Pending Deliveries", pendingDeliveries],
      ["Low Stock Alerts", lowStockItems],
      ["Total Products", totalProducts],
      [""],
      ["Recent Receipts"],
      ["Reference", "Supplier", "Status", "Scheduled Date"],
      ...mockReceipts.slice(0, 5).map((r) => [
        r.reference,
        r.supplier,
        r.status,
        new Date(r.scheduleDate).toLocaleDateString(),
      ]),
      [""],
      ["Recent Deliveries"],
      ["Reference", "Customer", "Status", "Scheduled Date"],
      ...mockDeliveries.slice(0, 5).map((d) => [
        d.reference,
        d.toContact,
        d.status,
        new Date(d.scheduleDate).toLocaleDateString(),
      ]),
    ]

    const csvContent = reportData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `dashboard-report-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadReport}>
            <FileDown className="mr-2 size-4" />
            Download Report
          </Button>
          <Button size="sm" className="gap-2" onClick={() => router.push("/dashboard/ai")}>
            <Sparkles className="size-4" />
            AI Insights
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Pending Receipts"
          value="12"
          description="3 items arriving today"
          icon={Archive}
          trend={8.2}
          trendLabel="vs last week"
        />
        <KPICard
          title="Pending Deliveries"
          value="24"
          description="8 orders to ship"
          icon={Truck}
          trend={-4.5}
          trendLabel="vs last week"
        />
        <KPICard
          title="Low Stock Alerts"
          value="3"
          description="Items below reorder point"
          icon={AlertTriangle}
          trend={0}
          trendLabel="stable"
        />
        <KPICard
          title="Total Products"
          value="1,284"
          description="Active SKUs"
          icon={Package}
          trend={12}
          trendLabel="new items"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <OverviewChart />
        <RecentMoves />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Sparkles className="size-5" />
              AI Predictive Insight
            </CardTitle>
            <CardDescription>Forecast based on recent trends</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Product <strong>Widget Pro 2000</strong> is projected to run out of stock in <strong>4 days</strong> based
              on current delivery velocity.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-accent/20 hover:bg-accent/10 hover:text-accent bg-transparent"
            >
              View Reorder Suggestion
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-success" />
                <span className="text-sm font-medium">Database</span>
              </div>
              <span className="text-xs text-muted-foreground">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-success" />
                <span className="text-sm font-medium">AI Engine</span>
              </div>
              <span className="text-xs text-muted-foreground">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-success" />
                <span className="text-sm font-medium">Socket.io</span>
              </div>
              <span className="text-xs text-muted-foreground">Connected</span>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => router.push("/dashboard/receipts")}
            >
              <Archive className="size-4 mr-2" />
              New Receipt
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => router.push("/dashboard/deliveries")}
            >
              <Truck className="size-4 mr-2" />
              New Delivery
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => router.push("/dashboard/stock")}
            >
              <Package className="size-4 mr-2" />
              Check Stock
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
