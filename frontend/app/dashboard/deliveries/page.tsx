"use client"

import { useState } from "react"
import { Plus, Filter, FileDown, MoreHorizontal, Truck, Clock, AlertOctagon, X } from "lucide-react"
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
import { mockDeliveries, mockProducts, mockWarehouses, mockStockQuants } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import type { Delivery, DeliveryLine } from "@/lib/types"

export default function DeliveriesPage() {
  const [view, setView] = useState<"list" | "kanban">("list")
  const [isNewDeliveryOpen, setIsNewDeliveryOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [deliveryForm, setDeliveryForm] = useState({
    toContact: "",
    scheduleDate: new Date().toISOString().split("T")[0],
    warehouseId: "",
    status: "DRAFT" as const,
  })
  const [deliveryLines, setDeliveryLines] = useState<Array<{ productId: string; quantity: number }>>([
    { productId: "", quantity: 0 },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-success/10 text-success hover:bg-success/20 border-success/20"
      case "READY":
        return "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
      case "WAITING":
        return "bg-warning/10 text-warning hover:bg-warning/20 border-warning/20"
      case "DRAFT":
        return "bg-muted text-muted-foreground hover:bg-muted/80"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const handleAddDeliveryLine = () => {
    setDeliveryLines([...deliveryLines, { productId: "", quantity: 0 }])
  }

  const handleRemoveDeliveryLine = (index: number) => {
    setDeliveryLines(deliveryLines.filter((_, i) => i !== index))
  }

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault()
    const newDelivery: Delivery = {
      id: String(mockDeliveries.length + 1),
      reference: `WH/OUT/${String(mockDeliveries.length + 1).padStart(4, "0")}`,
      warehouseId: deliveryForm.warehouseId,
      toContact: deliveryForm.toContact,
      scheduleDate: new Date(deliveryForm.scheduleDate),
      status: deliveryForm.status,
      responsibleUserId: "1",
      lines: deliveryLines
        .filter((line) => line.productId && line.quantity > 0)
        .map((line, index) => ({
          id: String(index + 1),
          deliveryId: String(mockDeliveries.length + 1),
          productId: line.productId,
          quantity: line.quantity,
          done: 0,
        })),
    }
    mockDeliveries.push(newDelivery)
    setIsNewDeliveryOpen(false)
    setDeliveryForm({
      toContact: "",
      scheduleDate: new Date().toISOString().split("T")[0],
      warehouseId: "",
      status: "DRAFT",
    })
    setDeliveryLines([{ productId: "", quantity: 0 }])
    alert("Delivery created successfully!")
  }

  const handleExport = () => {
    const headers = ["Reference", "Customer", "Scheduled Date", "Status", "Source Document"]
    const rows = mockDeliveries.map((delivery) => [
      delivery.reference,
      delivery.toContact,
      new Date(delivery.scheduleDate).toLocaleDateString(),
      delivery.status,
      `SO/2024/00${delivery.id}`,
    ])
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `deliveries-export-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleViewDetails = (delivery: Delivery) => {
    setSelectedDelivery(delivery)
    setIsDetailsOpen(true)
  }

  const handleCheckAvailability = (deliveryId: string) => {
    const delivery = mockDeliveries.find((d) => d.id === deliveryId)
    if (!delivery) return

    const shortages: Array<{ productId: string; needed: number; available: number }> = []
    delivery.lines.forEach((line) => {
      const totalAvailable = mockStockQuants
        .filter((q) => q.productId === line.productId)
        .reduce((sum, q) => sum + (q.quantity - q.reserved), 0)
      if (totalAvailable < line.quantity) {
        shortages.push({
          productId: line.productId,
          needed: line.quantity,
          available: totalAvailable,
        })
      }
    })

    if (shortages.length > 0) {
      delivery.shortages = shortages
      delivery.status = "WAITING"
      const productNames = shortages
        .map((s) => {
          const product = mockProducts.find((p) => p.id === s.productId)
          return `${product?.name || "Unknown"}: Need ${s.needed}, Have ${s.available}`
        })
        .join("\n")
      alert(`Stock shortage detected!\n\n${productNames}\n\nDelivery status changed to WAITING.`)
    } else {
      delivery.status = "READY"
      alert("All products are available in stock!\n\nDelivery status changed to READY.")
    }
  }

  const handleValidate = (deliveryId: string) => {
    const delivery = mockDeliveries.find((d) => d.id === deliveryId)
    if (delivery) {
      if (delivery.shortages && delivery.shortages.length > 0) {
        alert(`Cannot validate delivery ${delivery.reference}. Stock shortages detected.`)
        return
      }
      delivery.status = "DONE"
      delivery.lines.forEach((line) => {
        line.done = line.quantity
      })
      alert(`Delivery ${delivery.reference} has been validated and marked as DONE!`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deliveries</h1>
          <p className="text-muted-foreground">Manage outbound orders to customers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileDown className="mr-2 size-4" />
            Export
          </Button>
          <Dialog open={isNewDeliveryOpen} onOpenChange={setIsNewDeliveryOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 size-4" />
                New Delivery
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleCreateDelivery}>
                <DialogHeader>
                  <DialogTitle>Create New Delivery</DialogTitle>
                  <DialogDescription>Add a new outbound delivery to a customer</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="toContact">Customer</Label>
                    <Input
                      id="toContact"
                      placeholder="Enter customer name"
                      value={deliveryForm.toContact}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, toContact: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="warehouse">Warehouse</Label>
                    <Select
                      value={deliveryForm.warehouseId}
                      onValueChange={(value) => setDeliveryForm({ ...deliveryForm, warehouseId: value })}
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
                      value={deliveryForm.scheduleDate}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, scheduleDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={deliveryForm.status}
                      onValueChange={(value) => setDeliveryForm({ ...deliveryForm, status: value as any })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="WAITING">Waiting</SelectItem>
                        <SelectItem value="READY">Ready</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>Products</Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddDeliveryLine}>
                        <Plus className="mr-2 size-4" />
                        Add Product
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {deliveryLines.map((line, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Label>Product</Label>
                            <Select
                              value={line.productId}
                              onValueChange={(value) => {
                                const newLines = [...deliveryLines]
                                newLines[index].productId = value
                                setDeliveryLines(newLines)
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
                                const newLines = [...deliveryLines]
                                newLines[index].quantity = parseInt(e.target.value) || 0
                                setDeliveryLines(newLines)
                              }}
                              required
                            />
                          </div>
                          {deliveryLines.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveDeliveryLine(index)}
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
                  <Button type="button" variant="outline" onClick={() => setIsNewDeliveryOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Delivery</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 w-full max-w-sm">
          <Input placeholder="Search deliveries..." className="h-9" />
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
                <TableHead>Customer</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Source Document</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDeliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium">{delivery.reference}</TableCell>
                  <TableCell>{delivery.toContact}</TableCell>
                  <TableCell>{new Date(delivery.scheduleDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-muted-foreground">SO/2024/00{delivery.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("font-medium", getStatusColor(delivery.status))}>
                      {delivery.status}
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
                        <DropdownMenuItem onClick={() => handleViewDetails(delivery)}>View details</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCheckAvailability(delivery.id)}
                          disabled={delivery.status === "DONE"}
                        >
                          Check Availability
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleValidate(delivery.id)}
                          disabled={delivery.status === "DONE" || delivery.status === "WAITING"}
                        >
                          Validate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm(`Are you sure you want to cancel ${delivery.reference}?`)) {
                              delivery.status = "CANCELLED"
                              alert(`Delivery ${delivery.reference} has been cancelled.`)
                            }
                          }}
                          disabled={delivery.status === "DONE" || delivery.status === "CANCELLED"}
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
          {["DRAFT", "WAITING", "READY", "DONE"].map((status) => (
            <div key={status} className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{status}</h3>
                <Badge variant="secondary" className="rounded-full px-2">
                  {mockDeliveries.filter((d) => d.status === status).length}
                </Badge>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                {mockDeliveries
                  .filter((d) => d.status === status)
                  .map((delivery) => (
                    <div
                      key={delivery.id}
                      className="rounded-md border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-sm group-hover:text-primary transition-colors">
                          {delivery.reference}
                        </span>
                        {status === "DONE" ? (
                          <Truck className="size-4 text-success" />
                        ) : status === "WAITING" ? (
                          <AlertOctagon className="size-4 text-warning" />
                        ) : (
                          <Clock className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{delivery.toContact}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(delivery.scheduleDate).toLocaleDateString()}</span>
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
