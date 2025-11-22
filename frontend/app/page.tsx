"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Boxes, ArrowRight, UserPlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockUsers } from "@/lib/mock-data"
import type { User } from "@/lib/types"
import { saveAuth } from "@/lib/utils/auth"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("admin@stockmaster.com")
  const [password, setPassword] = useState("password123")
  const [isLoading, setIsLoading] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [registerData, setRegisterData] = useState({
    loginId: "",
    email: "",
    name: "",
    password: "",
    role: "STAFF" as User["role"],
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (data.success) {
        saveAuth(data.data.user, data.data.token)
        router.push("/dashboard")
      } else {
        alert(data.message || "Login failed")
      }
    } catch (error) {
      console.error(error)
      alert("Connection error. Is the backend running on port 3000?")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would send data to backend
    // For now, just add to mockUsers and close dialog
    const newUser: User = {
      id: String(mockUsers.length + 1),
      loginId: registerData.loginId,
      email: registerData.email,
      name: registerData.name,
      role: registerData.role,
      createdAt: new Date(),
    }
    mockUsers.push(newUser)
    setIsRegisterOpen(false)
    // Reset form
    setRegisterData({
      loginId: "",
      email: "",
      name: "",
      password: "",
      role: "STAFF",
    })
    alert("User registered successfully! You can now login.")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="mb-8 flex flex-col items-center space-y-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Boxes className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold">StockMaster</h1>
        <p className="text-muted-foreground">Enterprise Intelligent Inventory Management</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Enter your email and password to access your account</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Sign In
              {!isLoading && <ArrowRight className="ml-2 size-4" />}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" size="sm">
                <UserPlus className="mr-2 size-4" />
                Create New Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleRegister}>
                <DialogHeader>
                  <DialogTitle>Create New User Account</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system. Fill in all the required information.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="loginId">Login ID</Label>
                    <Input
                      id="loginId"
                      placeholder="Enter login ID"
                      value={registerData.loginId}
                      onChange={(e) => setRegisterData({ ...registerData, loginId: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter full name"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="name@example.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Enter password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={registerData.role}
                      onValueChange={(value) => setRegisterData({ ...registerData, role: value as User["role"] })}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STAFF">Staff</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Account</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" className="w-full" size="sm">
            Forgot password?
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Protected by Enterprise Grade Security</p>
      </div>
    </div>
  )
}