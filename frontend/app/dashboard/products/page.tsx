"use client"

import { useState } from "react"
import { Plus, Filter, Package, BarChart3, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { mockProducts } from "@/lib/mock-data"
import type { Product } from "@/lib/types"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [searchQuery, setSearchQuery] = useState("")
  const [isNewProductOpen, setIsNewProductOpen] = useState(false)
  
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    sku: "",
    category: "",
    uom: "pcs",
    perUnitCost: 0,
    reorderQty: 0,
    initialStock: 0
  })

  // Filter Logic
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // KPI Calculations
  const totalProducts = products.length
  const lowStockCount = products.filter(p => (p.initialStock || 0) <= p.reorderQty).length
  const totalValue = products.reduce((sum, p) => sum + (p.perUnitCost * (p.initialStock || 0)), 0)

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault()
    const productToAdd: Product = {
      id: String(products.length + 1),
      name: newProduct.name || "New Product",
      sku: newProduct.sku || `SKU-${Date.now()}`,
      category: newProduct.category || "Uncategorized",
      uom: newProduct.uom || "pcs",
      perUnitCost: Number(newProduct.perUnitCost) || 0,
      reorderQty: Number(newProduct.reorderQty) || 0,
      initialStock: Number(newProduct.initialStock) || 0
    }

    setProducts([...products, productToAdd])
    setIsNewProductOpen(false)
    
    // Reset form
    setNewProduct({
      name: "",
      sku: "",
      category: "",
      uom: "pcs",
      perUnitCost: 0,
      reorderQty: 0,
      initialStock: 0
    })
    
    alert("Product created successfully!")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog and SKUs</p>
        </div>
        
        <Dialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 size-4" />
              New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <form onSubmit={handleCreateProduct}>
              <DialogHeader>
                <DialogTitle>Create New Product</DialogTitle>
                <DialogDescription>Add a new item to your master catalog.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input 
                      id="name" 
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU (Internal Ref)</Label>
                    <Input 
                      id="sku" 
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                      required 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={newProduct.category} 
                      onValueChange={(val) => setNewProduct({...newProduct, category: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Furniture">Furniture</SelectItem>
                        <SelectItem value="Parts">Parts</SelectItem>
                        <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uom">Unit of Measure</Label>
                    <Select 
                      value={newProduct.uom} 
                      onValueChange={(val) => setNewProduct({...newProduct, uom: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select UoM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        <SelectItem value="m">Meters (m)</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost ($)</Label>
                    <Input 
                      id="cost" 
                      type="number" 
                      min="0" 
                      value={newProduct.perUnitCost}
                      onChange={(e) => setNewProduct({...newProduct, perUnitCost: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Initial Stock</Label>
                    <Input 
                      id="stock" 
                      type="number" 
                      min="0"
                      value={newProduct.initialStock}
                      onChange={(e) => setNewProduct({...newProduct, initialStock: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reorder">Reorder Point</Label>
                    <Input 
                      id="reorder" 
                      type="number" 
                      min="0"
                      value={newProduct.reorderQty}
                      onChange={(e) => setNewProduct({...newProduct, reorderQty: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsNewProductOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Product</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Active SKUs in database</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-warning' : 'text-success'}`}>
              {lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground">Below reorder point</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <div className="font-mono font-bold text-muted-foreground">$</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current inventory valuation</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <Input 
          placeholder="Search products by name, SKU or category..." 
          className="h-9" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button variant="outline" size="icon" className="h-9 w-9 bg-transparent">
          <Search className="size-4" />
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Reorder Point</TableHead>
              <TableHead>UOM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono font-medium text-xs">{product.sku}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-full font-normal">
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">${product.perUnitCost.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold">{product.initialStock}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{product.reorderQty}</TableCell>
                  <TableCell className="text-muted-foreground text-xs uppercase">{product.uom}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No products found matching "{searchQuery}"
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}