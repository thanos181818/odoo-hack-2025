"use client"

import { useState } from "react"
import { Send, Bot, ShieldAlert, BrainCircuit, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  agent?: "ORACLE" | "GUARDIAN" | "SENTINEL"
}

export default function AIAgentsPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm the Stock Oracle. I can help you check stock levels, create receipts, or analyze inventory movements. How can I assist you today?",
      timestamp: new Date(),
      agent: "ORACLE",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [activeAgent, setActiveAgent] = useState<"ORACLE" | "GUARDIAN" | "SENTINEL">("ORACLE")

  const handleSend = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")

    // Mock AI response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm processing your request. In a real implementation, I would query the database and perform the requested action.",
        timestamp: new Date(),
        agent: activeAgent,
      }
      setMessages((prev) => [...prev, response])
    }, 1000)
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6">
      {/* Sidebar - Agent Selection */}
      <div className="w-80 flex flex-col gap-4">
        <div
          className={cn(
            "p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md",
            activeAgent === "ORACLE"
              ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
              : "bg-card hover:bg-accent/5",
          )}
          onClick={() => setActiveAgent("ORACLE")}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Bot className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold">Stock Oracle</h3>
              <p className="text-xs text-muted-foreground">Conversational Assistant</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Ask about stock levels, create receipts, and manage day-to-day operations through chat.
          </p>
        </div>

        <div
          className={cn(
            "p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md",
            activeAgent === "GUARDIAN"
              ? "border-accent bg-accent/5 shadow-sm ring-1 ring-accent"
              : "bg-card hover:bg-accent/5",
          )}
          onClick={() => setActiveAgent("GUARDIAN")}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/10 rounded-lg text-accent">
              <BrainCircuit className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold">Predictive Guardian</h3>
              <p className="text-xs text-muted-foreground">Forecasting & Insights</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Analyzes trends to predict stockouts and suggest optimal reorder points.
          </p>
        </div>

        <div
          className={cn(
            "p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md",
            activeAgent === "SENTINEL"
              ? "border-destructive bg-destructive/5 shadow-sm ring-1 ring-destructive"
              : "bg-card hover:bg-accent/5",
          )}
          onClick={() => setActiveAgent("SENTINEL")}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-destructive/10 rounded-lg text-destructive">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold">Anomaly Sentinel</h3>
              <p className="text-xs text-muted-foreground">Security & Auditing</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Detects suspicious activities, large adjustments, and irregular patterns.
          </p>
        </div>
      </div>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col shadow-sm border-border/60">
        <CardHeader className="border-b px-6 py-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <Avatar
              className={cn(
                "size-10 border",
                activeAgent === "ORACLE"
                  ? "bg-primary/10 text-primary border-primary/20"
                  : activeAgent === "GUARDIAN"
                    ? "bg-accent/10 text-accent border-accent/20"
                    : "bg-destructive/10 text-destructive border-destructive/20",
              )}
            >
              <AvatarFallback>
                {activeAgent === "ORACLE" ? (
                  <Bot className="size-5" />
                ) : activeAgent === "GUARDIAN" ? (
                  <BrainCircuit className="size-5" />
                ) : (
                  <ShieldAlert className="size-5" />
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">
                {activeAgent === "ORACLE"
                  ? "Stock Oracle"
                  : activeAgent === "GUARDIAN"
                    ? "Predictive Guardian"
                    : "Anomaly Sentinel"}
              </CardTitle>
              <CardDescription className="text-xs flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success/50 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                Online • Ready to assist
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Clear History
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 max-w-[80%]",
                    message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto",
                  )}
                >
                  <Avatar className="size-8 mt-1 border">
                    {message.role === "user" ? (
                      <>
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback>AD</AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback
                        className={cn(
                          message.agent === "ORACLE"
                            ? "bg-primary/10 text-primary"
                            : message.agent === "GUARDIAN"
                              ? "bg-accent/10 text-accent"
                              : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {message.agent === "ORACLE" ? (
                          <Bot className="size-4" />
                        ) : message.agent === "GUARDIAN" ? (
                          <BrainCircuit className="size-4" />
                        ) : (
                          <ShieldAlert className="size-4" />
                        )}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted rounded-tl-none",
                    )}
                  >
                    <p>{message.content}</p>
                    <span
                      className={cn(
                        "text-[10px] mt-1 block opacity-70",
                        message.role === "user" ? "text-primary-foreground" : "text-muted-foreground",
                      )}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 bg-background/50 backdrop-blur-sm border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center gap-3"
            >
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0 text-muted-foreground hover:text-primary"
              >
                <Mic className="size-5" />
              </Button>
              <Input
                placeholder={`Message ${activeAgent === "ORACLE" ? "Stock Oracle" : activeAgent === "GUARDIAN" ? "Predictive Guardian" : "Anomaly Sentinel"}...`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-background border-border/50 focus-visible:ring-1"
              />
              <Button type="submit" size="icon" disabled={!inputValue.trim()} className="shrink-0">
                <Send className="size-4" />
              </Button>
            </form>
            <div className="text-[10px] text-center text-muted-foreground mt-2">
              AI can make mistakes. Please verify important operational data.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
