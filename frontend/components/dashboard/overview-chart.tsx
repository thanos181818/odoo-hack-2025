"use client"

import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
  { name: "Mon", receipts: 12, deliveries: 8 },
  { name: "Tue", receipts: 15, deliveries: 10 },
  { name: "Wed", receipts: 8, deliveries: 12 },
  { name: "Thu", receipts: 18, deliveries: 15 },
  { name: "Fri", receipts: 24, deliveries: 20 },
  { name: "Sat", receipts: 5, deliveries: 8 },
  { name: "Sun", receipts: 2, deliveries: 3 },
]

export function OverviewChart() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Weekly Operations</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: "12px",
                }}
                cursor={{ fill: "var(--muted)" }}
              />
              <Bar dataKey="receipts" name="Receipts" fill="var(--chart-1)" radius={[4, 4, 0, 0]} barSize={30} />
              <Bar dataKey="deliveries" name="Deliveries" fill="var(--chart-2)" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
