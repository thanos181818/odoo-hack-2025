"use client"

import { useState } from "react"
import { Plus, Filter, FileDown, MoreHorizontal, CheckCircle2, Clock, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockReceipts, mockProducts, mockWarehouses } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import type { Receipt, ReceiptLine } from "@/lib/types"

export default function ReceiptsPage() {
  const [view, setView] = useState<"list" | "kanban">("list")
  const [isNewReceiptOpen, setIsNewReceiptOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [receiptForm, setReceiptForm] = useState({
    supplier: "",
    scheduleDate: new Date().toISOString().split("T")[0],
    warehouseId: "",
    status: "DRAFT" as const,
  })
  const [receiptLines, setReceiptLines] = useState<Array<{ productId: string; quantity: number }>>([
    { productId: "", quantity: 0 },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-success/10 text-success hover:bg-success/20 border-success/20"
      case "READY":
        return "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
      case "DRAFT":
        return "bg-muted text-muted-foreground hover:bg-muted/80"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const handleAddReceiptLine = () => {
    setReceiptLines([...receiptLines, { productId: "", quantity: 0 }])
  }

  const handleRemoveReceiptLine = (index: number) => {
    setReceiptLines(receiptLines.filter((_, i) => i !== index))
  }

  const handleCreateReceipt = (e: React.FormEvent) => {
    e.preventDefault()
    const newReceipt: Receipt = {
      id: String(mockReceipts.length + 1),
      reference: `WH/IN/${String(mockReceipts.length + 1).padStart(4, "0")}`,
      warehouseId: receiptForm.warehouseId,
      supplier: receiptForm.supplier,
      scheduleDate: new Date(receiptForm.scheduleDate),
      status: receiptForm.status,
      responsibleUserId: "1",
      lines: receiptLines
        .filter((line) => line.productId && line.quantity > 0)
        .map((line, index) => ({
          id: String(index + 1),
          receiptId: String(mockReceipts.length + 1),
          productId: line.productId,
          quantity: line.quantity,
          done: 0,
        })),
    }
    mockReceipts.push(newReceipt)
    setIsNewReceiptOpen(false)
    setReceiptForm({
      supplier: "",
      scheduleDate: new Date().toISOString().split("T")[0],
      warehouseId: "",
      status: "DRAFT",
    })
    setReceiptLines([{ productId: "", quantity: 0 }])
    alert("Receipt created successfully!")
  }

  const handleExport = () => {
    const headers = ["Reference", "Supplier", "Scheduled Date", "Status", "Source Document"]
    const rows = mockReceipts.map((receipt) => [
      receipt.reference,
      receipt.supplier,
      new Date(receipt.scheduleDate).toLocaleDateString(),
      receipt.status,
      `PO/2024/00${receipt.id}`,
    ])
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `receipts-export-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleViewDetails = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setIsDetailsOpen(true)
  }

  const handleValidate = (receiptId: string) => {
    const receipt = mockReceipts.find((r) => r.id === receiptId)
    if (receipt) {
      receipt.status = "DONE"
      receipt.lines.forEach((line) => {
        line.done = line.quantity
      })
      alert(`Receipt ${receipt.reference} has been validated and marked as DONE!`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
          <p className="text-muted-foreground">Manage inbound inventory from suppliers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileDown className="mr-2 size-4" />
            Export
          </Button>
          <Dialog open={isNewReceiptOpen} onOpenChange={setIsNewReceiptOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 size-4" />
                New Receipt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleCreateReceipt}>
                <DialogHeader>
                  <DialogTitle>Create New Receipt</DialogTitle>
                  <DialogDescription>Add a new inbound receipt from a supplier</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      placeholder="Enter supplier name"
                      value={receiptForm.supplier}
                      onChange={(e) => setReceiptForm({ ...receiptForm, supplier: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="warehouse">Warehouse</Label>
                    <Select
                      value={receiptForm.warehouseId}
                      onValueChange={(value) => setReceiptForm({ ...receiptForm, warehouseId: value })}
                    >
                      <SelectTrigger id="warehouse">
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockWarehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} ({warehouse.shortCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="scheduleDate">Scheduled Date</Label>
                    <Input
                      id="scheduleDate"
                      type="date"
                      value={receiptForm.scheduleDate}
                      onChange={(e) => setReceiptForm({ ...receiptForm, scheduleDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={receiptForm.status}
                      onValueChange={(value) => setReceiptForm({ ...receiptForm, status: value as any })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="READY">Ready</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>Products</Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddReceiptLine}>
                        <Plus className="mr-2 size-4" />
                        Add Product
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {receiptLines.map((line, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Label>Product</Label>
                            <Select
                              value={line.productId}
                              onValueChange={(value) => {
                                const newLines = [...receiptLines]
                                newLines[index].productId = value
                                setReceiptLines(newLines)
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {mockProducts.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} ({product.sku})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-32">
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={line.quantity || ""}
                              onChange={(e) => {
                                const newLines = [...receiptLines]
                                newLines[index].quantity = parseInt(e.target.value) || 0
                                setReceiptLines(newLines)
                              }}
                              required
                            />
                          </div>
                          {receiptLines.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveReceiptLine(index)}
                            >
                              <X className="size-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsNewReceiptOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Receipt</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Receipt Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
            <DialogDescription>Complete information about the receipt</DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Reference</Label>
                  <p className="font-medium">{selectedReceipt.reference}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>
                    <Badge variant="outline" className={cn("font-medium", getStatusColor(selectedReceipt.status))}>
                      {selectedReceipt.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Supplier</Label>
                  <p className="font-medium">{selectedReceipt.supplier}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Scheduled Date</Label>
                  <p className="font-medium">{new Date(selectedReceipt.scheduleDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Source Document</Label>
                  <p className="font-medium">PO/2024/00{selectedReceipt.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Warehouse</Label>
                  <p className="font-medium">
                    {mockWarehouses.find((w) => w.id === selectedReceipt.warehouseId)?.name || "N/A"}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">Products</Label>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Done</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReceipt.lines.map((line) => {
                        const product = mockProducts.find((p) => p.id === line.productId)
                        return (
                          <TableRow key={line.id}>
                            <TableCell className="font-medium">{product?.name || "Unknown"}</TableCell>
                            <TableCell className="text-muted-foreground">{product?.sku || "N/A"}</TableCell>
                            <TableCell className="text-right font-medium">{line.quantity}</TableCell>
                            <TableCell className="text-right">{line.done}</TableCell>
                            <TableCell className="text-right">{line.quantity - line.done}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            {selectedReceipt && selectedReceipt.status !== "DONE" && (
              <Button
                onClick={() => {
                  handleValidate(selectedReceipt.id)
                  setIsDetailsOpen(false)
                }}
              >
                Validate Receipt
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 w-full max-w-sm">
          <Input placeholder="Search receipts..." className="h-9" />
          <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent">
            <Filter className="size-4" />
          </Button>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as "list" | "kanban")} className="w-[200px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "list" ? (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Source Document</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">{receipt.reference}</TableCell>
                  <TableCell>{receipt.supplier}</TableCell>
                  <TableCell>{new Date(receipt.scheduleDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-muted-foreground">PO/2024/00{receipt.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("font-medium", getStatusColor(receipt.status))}>
                      {receipt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(receipt)}>View details</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleValidate(receipt.id)}
                          disabled={receipt.status === "DONE"}
                        >
                          Validate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm(`Are you sure you want to cancel ${receipt.reference}?`)) {
                              receipt.status = "CANCELLED"
                              alert(`Receipt ${receipt.reference} has been cancelled.`)
                            }
                          }}
                          disabled={receipt.status === "DONE" || receipt.status === "CANCELLED"}
                        >
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 h-[calc(100vh-280px)]">
          {["DRAFT", "READY", "DONE", "CANCELLED"].map((status) => (
            <div key={status} className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{status}</h3>
                <Badge variant="secondary" className="rounded-full px-2">
                  {mockReceipts.filter((r) => r.status === status).length}
                </Badge>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                {mockReceipts
                  .filter((r) => r.status === status)
                  .map((receipt) => (
                    <div
                      key={receipt.id}
                      className="rounded-md border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-sm">{receipt.reference}</span>
                        {status === "DONE" ? (
                          <CheckCircle2 className="size-4 text-success" />
                        ) : status === "READY" ? (
                          <Clock className="size-4 text-primary" />
                        ) : (
                          <FileText className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{receipt.supplier}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(receipt.scheduleDate).toLocaleDateString()}</span>
                        <div className="flex -space-x-2">
                          <div className="size-6 rounded-full bg-primary/20 border border-background flex items-center justify-center text-[10px] font-bold text-primary">
                            AD
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
