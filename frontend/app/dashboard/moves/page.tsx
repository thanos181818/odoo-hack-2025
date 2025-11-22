"use client"

import { useState } from "react"
import { Filter, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockStockMoves, mockProducts, mockLocations } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export default function MoveHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")

  // Filter logic
  const filteredMoves = mockStockMoves.filter((move) => {
    const product = mockProducts.find((p) => p.id === move.productId)
    const fromLoc = mockLocations.find((l) => l.id === move.fromLocationId)
    const toLoc = mockLocations.find((l) => l.id === move.toLocationId)

    // 1. Check Search Query (matches Reference, Product Name, or Location Codes)
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      move.reference.toLowerCase().includes(searchLower) ||
      (product?.name || "").toLowerCase().includes(searchLower) ||
      (fromLoc?.shortCode || "").toLowerCase().includes(searchLower) ||
      (toLoc?.shortCode || "").toLowerCase().includes(searchLower)

    // 2. Check Type Filter
    const matchesType = filterType === "all" || move.type.toLowerCase() === filterType.toLowerCase()

    return matchesSearch && matchesType
  })

  const handleExportLedger = () => {
    const headers = ["Date", "Reference", "Product", "From Location", "To Location", "Quantity", "Type"]
    const rows = filteredMoves.map((move) => {
      const product = mockProducts.find((p) => p.id === move.productId)
      const fromLoc = mockLocations.find((l) => l.id === move.fromLocationId)
      const toLoc = mockLocations.find((l) => l.id === move.toLocationId)

      return [
        new Date(move.createdAt).toLocaleString(),
        move.reference,
        product?.name || "",
        fromLoc?.shortCode || "-",
        toLoc?.shortCode || "-",
        move.qty.toString(),
        move.type,
      ]
    })

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `move-history-ledger-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Move History</h1>
          <p className="text-muted-foreground">Complete ledger of all inventory movements</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportLedger}>
            <FileDown className="mr-2 size-4" />
            Export Ledger
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Input 
            placeholder="Search reference, product..." 
            className="h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent">
            <Filter className="size-4" />
          </Button>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="receipt">Receipts</SelectItem>
            <SelectItem value="delivery">Deliveries</SelectItem>
            <SelectItem value="transfer">Transfers</SelectItem>
            <SelectItem value="adjustment">Adjustments</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="w-[120px]">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMoves.length > 0 ? (
              filteredMoves.map((move) => {
                const product = mockProducts.find((p) => p.id === move.productId)
                const fromLoc = mockLocations.find((l) => l.id === move.fromLocationId)
                const toLoc = mockLocations.find((l) => l.id === move.toLocationId)

                return (
                  <TableRow key={move.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                      {new Date(move.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{move.reference}</TableCell>
                    <TableCell>{product?.name}</TableCell>
                    <TableCell>
                      {fromLoc ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {fromLoc.shortCode}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {toLoc ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {toLoc.shortCode}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono font-medium",
                        move.type === "RECEIPT"
                          ? "text-success"
                          : move.type === "DELIVERY"
                            ? "text-destructive"
                            : "text-foreground",
                      )}
                    >
                      {move.type === "DELIVERY" || (move.type === "ADJUSTMENT" && move.qty < 0) ? "" : "+"}
                      {move.qty}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "rounded-sm font-normal",
                          move.type === "RECEIPT" && "bg-success/10 text-success hover:bg-success/20",
                          move.type === "DELIVERY" && "bg-destructive/10 text-destructive hover:bg-destructive/20",
                          move.type === "TRANSFER" && "bg-primary/10 text-primary hover:bg-primary/20",
                          move.type === "ADJUSTMENT" && "bg-warning/10 text-warning hover:bg-warning/20",
                        )}
                      >
                        {move.type}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No moves found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}