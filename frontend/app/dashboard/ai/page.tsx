"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Bot, ShieldAlert, BrainCircuit, Mic, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { fetchAPI, fetchSentinel } from "@/lib/api"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  agent?: "ORACLE" | "GUARDIAN" | "SENTINEL"
  requiresConfirmation?: boolean
  operationId?: string
}

function MessageTime({ date }: { date: Date }) {
  const [timeString, setTimeString] = useState<string>("")
  useEffect(() => {
    setTimeString(date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
  }, [date])
  if (!timeString) return <span className="opacity-0">00:00</span>
  return <span>{timeString}</span>
}

export default function AIAgentsPage() {
  const [messages, setMessages] = useState<Message[]>([])
  
  useEffect(() => {
    setMessages([{
      id: "1",
      role: "assistant",
      content: "Hello! I'm the Stock Oracle. I can help you check stock levels, create receipts, or analyze inventory movements. How can I assist you today?",
      timestamp: new Date(),
      agent: "ORACLE",
    }])
  }, [])

  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeAgent, setActiveAgent] = useState<"ORACLE" | "GUARDIAN" | "SENTINEL">("ORACLE")
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputValue("")
    setIsLoading(true)

    try {
      if (activeAgent === "ORACLE") {
        const data = await fetchAPI("/chat", {
          method: "POST",
          body: JSON.stringify({ message: userMsg.content }),
        })

        if (data.success) {
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.data.response,
            timestamp: new Date(),
            agent: "ORACLE",
            requiresConfirmation: data.data.requiresConfirmation,
            operationId: data.data.requiresConfirmation ? extractOperationId(data.data.response) : undefined
          }
          setMessages((prev) => [...prev, aiMsg])
        }
      } 
      else if (activeAgent === "GUARDIAN") {
        try {
          const response = await fetch("http://localhost:3000/api/guardian/alerts.json");
          if (!response.ok) throw new Error("Forecast data not generated yet.");
          const alerts = await response.json();
          
          let content = "Here are the latest predictive insights:\n\n"
          if (Array.isArray(alerts) && alerts.length > 0) {
            alerts.forEach((a: any) => {
              const icon = a.severity === 'critical' ? '🔴' : '🟡';
              content += `${icon} **${a.product}** at ${a.location}\n${a.message}\n\n`
            })
          } else {
            content = "✅ No critical stockouts predicted for the next 7 days."
          }

          setMessages((prev) => [...prev, {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: content,
            timestamp: new Date(),
            agent: "GUARDIAN"
          }])
        } catch (err: any) {
          setMessages((prev) => [...prev, {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `⚠️ Data Unavailable: Please run the Agent 2 Python script.`,
            timestamp: new Date(),
            agent: "GUARDIAN"
          }])
        }
      } 
      else if (activeAgent === "SENTINEL") {
        const mockTrx = { qty: 500, hour: 3, damage_flag: 0, type: "move", has_receipt: true }
        const result = await fetchSentinel("/analyze_transaction", mockTrx)
        
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Analysis Result:\nStatus: ${result.status}\nReason: ${result.reasons?.[0] || 'None'}\nContext: ${result.rag_context || 'None'}`,
          timestamp: new Date(),
          agent: "SENTINEL"
        }])
      }
    } catch (error) {
      console.error(error)
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Error connecting to the agent.",
        timestamp: new Date(),
        agent: activeAgent
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleExecute = async (operationId: string) => {
    setIsLoading(true)
    try {
      const res = await fetchAPI("/chat/execute", {
        method: "POST",
        body: JSON.stringify({ operationId, approved: true })
      })
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: res.message || "Operation executed successfully.",
        timestamp: new Date(),
        agent: "ORACLE"
      }])
    } catch (e) {
      alert("Failed to execute")
    } finally {
      setIsLoading(false)
    }
  }

  const extractOperationId = (text: string) => {
    const match = text.match(/ID:\s*([a-zA-Z0-9-]+)/)
    return match ? match[1] : undefined
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 overflow-hidden">
      {/* Sidebar - Agent Selection - Fixed width, Scrollable if needed */}
      <div className="w-80 flex flex-col gap-4 min-w-[320px] overflow-y-auto pr-2">
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
            Ask about stock levels, create receipts, and manage day-to-day operations.
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

      {/* Main Chat Area - Flex Column taking remaining space */}
      <Card className="flex-1 flex flex-col shadow-sm border-border/60 overflow-hidden h-full">
        
        {/* Header - Fixed at top */}
        <div className="border-b px-6 py-4 flex flex-row items-center justify-between space-y-0 bg-card shrink-0 z-10">
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
              <h2 className="text-base font-semibold">
                {activeAgent === "ORACLE"
                  ? "Stock Oracle"
                  : activeAgent === "GUARDIAN"
                    ? "Predictive Guardian"
                    : "Anomaly Sentinel"}
              </h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success/50 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                Online • Ready to assist
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setMessages([])}>
            Clear History
          </Button>
        </div>

        {/* Messages - Scrollable Middle Section */}
        <div className="flex-1 overflow-hidden relative bg-background">
          <ScrollArea className="h-full w-full p-6">
            <div className="space-y-6 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto",
                  )}
                >
                  <Avatar className="size-8 mt-1 border shrink-0">
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
                      "rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap break-words shadow-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted rounded-tl-none",
                    )}
                  >
                    <p>{message.content}</p>
                    
                    {message.requiresConfirmation && message.operationId && (
                      <div className="mt-3 pt-2 border-t border-border/20">
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="w-full bg-background/50 hover:bg-background/80"
                          onClick={() => handleExecute(message.operationId!)}
                        >
                          Confirm & Execute
                        </Button>
                      </div>
                    )}

                    <div className={cn(
                        "text-[10px] mt-1 block opacity-70",
                        message.role === "user" ? "text-primary-foreground" : "text-muted-foreground",
                      )}>
                      <MessageTime date={message.timestamp} />
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                 <div className="flex gap-3 mr-auto">
                    <Avatar className="size-8 mt-1 border shrink-0"><AvatarFallback>...</AvatarFallback></Avatar>
                    <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
                      <div className="flex gap-1">
                        <span className="animate-bounce">●</span>
                        <span className="animate-bounce delay-100">●</span>
                        <span className="animate-bounce delay-200">●</span>
                      </div>
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          </ScrollArea>
        </div>

        {/* Input - Fixed at bottom */}
        <div className="p-4 bg-background/50 backdrop-blur-sm border-t shrink-0">
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
            <Button type="submit" size="icon" disabled={!inputValue.trim() || isLoading} className="shrink-0">
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
          <div className="text-[10px] text-center text-muted-foreground mt-2">
            AI can make mistakes. Please verify important operational data.
          </div>
        </div>
      </Card>
    </div>
  )
}