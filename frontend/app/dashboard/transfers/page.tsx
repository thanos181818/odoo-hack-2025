"use client"

import { useState } from "react"
import { Plus, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import { mockStockMoves, mockProducts, mockLocations } from "@/lib/mock-data"
import type { StockMove } from "@/lib/types"

export default function TransfersPage() {
  const transfers = mockStockMoves.filter((m) => m.type === "TRANSFER")
  const [isNewTransferOpen, setIsNewTransferOpen] = useState(false)
  const [transferLines, setTransferLines] = useState<
    Array<{ productId: string; fromLocationId: string; toLocationId: string; quantity: number }>
  >([{ productId: "", fromLocationId: "", toLocationId: "", quantity: 0 }])

  const handleAddTransferLine = () => {
    setTransferLines([...transferLines, { productId: "", fromLocationId: "", toLocationId: "", quantity: 0 }])
  }

  const handleRemoveTransferLine = (index: number) => {
    setTransferLines(transferLines.filter((_, i) => i !== index))
  }

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault()
    transferLines
      .filter((line) => line.productId && line.fromLocationId && line.toLocationId && line.quantity > 0)
      .forEach((line, index) => {
        const newTransfer: StockMove = {
          id: String(mockStockMoves.length + index + 1),
          reference: `INT/TR/${String(mockStockMoves.filter((m) => m.type === "TRANSFER").length + index + 1).padStart(4, "0")}`,
          type: "TRANSFER",
          productId: line.productId,
          fromLocationId: line.fromLocationId,
          toLocationId: line.toLocationId,
          qty: line.quantity,
          createdBy: "1",
          createdAt: new Date(),
        }
        mockStockMoves.push(newTransfer)
      })
    setIsNewTransferOpen(false)
    setTransferLines([{ productId: "", fromLocationId: "", toLocationId: "", quantity: 0 }])
    alert("Transfer(s) created successfully!")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Internal Transfers</h1>
          <p className="text-muted-foreground">Move stock between warehouse locations</p>
        </div>
        <Dialog open={isNewTransferOpen} onOpenChange={setIsNewTransferOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 size-4" />
              New Transfer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateTransfer}>
              <DialogHeader>
                <DialogTitle>Create New Transfer</DialogTitle>
                <DialogDescription>Transfer products between warehouse locations</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Transfer Lines</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddTransferLine}>
                      <Plus className="mr-2 size-4" />
                      Add Product
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {transferLines.map((line, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Line {index + 1}</span>
                          {transferLines.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRemoveTransferLine(index)}
                            >
                              <X className="size-3" />
                            </Button>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <div>
                            <Label>Product</Label>
                            <Select
                              value={line.productId}
                              onValueChange={(value) => {
                                const newLines = [...transferLines]
                                newLines[index].productId = value
                                setTransferLines(newLines)
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
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label>From Location</Label>
                              <Select
                                value={line.fromLocationId}
                                onValueChange={(value) => {
                                  const newLines = [...transferLines]
                                  newLines[index].fromLocationId = value
                                  setTransferLines(newLines)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="From" />
                                </SelectTrigger>
                                <SelectContent>
                                  {mockLocations.map((location) => (
                                    <SelectItem key={location.id} value={location.id}>
                                      {location.shortCode} - {location.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>To Location</Label>
                              <Select
                                value={line.toLocationId}
                                onValueChange={(value) => {
                                  const newLines = [...transferLines]
                                  newLines[index].toLocationId = value
                                  setTransferLines(newLines)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="To" />
                                </SelectTrigger>
                                <SelectContent>
                                  {mockLocations.map((location) => (
                                    <SelectItem key={location.id} value={location.id}>
                                      {location.shortCode} - {location.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={line.quantity || ""}
                              onChange={(e) => {
                                const newLines = [...transferLines]
                                newLines[index].quantity = parseInt(e.target.value) || 0
                                setTransferLines(newLines)
                              }}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsNewTransferOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Transfer(s)</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <Input placeholder="Search transfers..." className="h-9" />
        <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent">
          <Filter className="size-4" />
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.length > 0 ? (
              transfers.map((transfer) => {
                const product = mockProducts.find((p) => p.id === transfer.productId)
                const fromLoc = mockLocations.find((l) => l.id === transfer.fromLocationId)
                const toLoc = mockLocations.find((l) => l.id === transfer.toLocationId)

                return (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-medium">{transfer.reference}</TableCell>
                    <TableCell>{new Date(transfer.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{product?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{fromLoc?.shortCode}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{toLoc?.shortCode}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">{transfer.qty}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20">
                        DONE
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No transfers found. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
