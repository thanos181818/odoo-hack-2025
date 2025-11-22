"use client"

import { useRouter } from "next/navigation"
import { Filter, FileDown, History, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { mockStockQuants, mockProducts, mockLocations } from "@/lib/mock-data"
import { Progress } from "@/components/ui/progress"

export default function StockPage() {
  const router = useRouter()

  const handleExport = () => {
    // Create CSV content
    const headers = ["Product", "SKU", "Location", "On Hand", "Reserved", "Available", "Status"]
    const rows = mockStockQuants.map((quant) => {
      const product = mockProducts.find((p) => p.id === quant.productId)
      const location = mockLocations.find((l) => l.id === quant.locationId)
      const available = quant.quantity - quant.reserved
      const isLowStock = product?.reorderQty ? available <= product.reorderQty : false
      const status = isLowStock ? "Low Stock" : "OK"

      return [
        product?.name || "",
        product?.sku || "",
        location?.name || "",
        quant.quantity.toString(),
        quant.reserved.toString(),
        available.toString(),
        status,
      ]
    })

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `stock-export-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Current Stock</h1>
          <p className="text-muted-foreground">Real-time inventory levels by location</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/moves")}>
            <History className="mr-2 size-4" />
            Moves
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileDown className="mr-2 size-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <Input placeholder="Search products, SKUs, locations..." className="h-9" />
        <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent">
          <Filter className="size-4" />
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">On Hand</TableHead>
              <TableHead className="text-right">Reserved</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="w-[150px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockStockQuants.map((quant) => {
              const product = mockProducts.find((p) => p.id === quant.productId)
              const location = mockLocations.find((l) => l.id === quant.locationId)
              const available = quant.quantity - quant.reserved
              const isLowStock = product?.reorderQty ? available <= product.reorderQty : false

              return (
                <TableRow key={quant.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{product?.name}</span>
                      <span className="text-xs text-muted-foreground">{product?.sku}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-sm">
                      {location?.shortCode}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-2">{location?.name}</span>
                  </TableCell>
                  <TableCell className="text-right font-medium">{quant.quantity}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{quant.reserved}</TableCell>
                  <TableCell className="text-right font-bold">{available}</TableCell>
                  <TableCell>
                    {isLowStock ? (
                      <div className="flex items-center gap-2 text-destructive text-xs font-medium">
                        <AlertTriangle className="size-3" />
                        Low Stock
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Progress value={(available / (product?.initialStock || 100)) * 100} className="h-1.5 w-16" />
                        <span className="text-xs text-muted-foreground">OK</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
