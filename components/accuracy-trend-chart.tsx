"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts"

const chartData = [
  { date: "5월 28일", pronunciation: 72, intonation: 68 },
  { date: "5월 29일", pronunciation: 75, intonation: 71 },
  { date: "5월 30일", pronunciation: 78, intonation: 74 },
  { date: "5월 31일", pronunciation: 82, intonation: 79 },
  { date: "6월 1일", pronunciation: 85, intonation: 82 },
  { date: "6월 2일", pronunciation: 88, intonation: 85 },
  { date: "6월 3일", pronunciation: 91, intonation: 88 },
]

const chartConfig = {
  pronunciation: {
    label: "발음 정확도",
    color: "#3EE6C1",
  },
  intonation: {
    label: "억양",
    color: "#5AC8FA",
  },
}

export function AccuracyTrendChart() {
  return (
    <ChartContainer config={chartConfig} className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A3649" vertical={false} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#A0AEC0", fontSize: 10 }} dy={10} />
          <YAxis
            domain={[50, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#A0AEC0", fontSize: 10 }}
            dx={-10}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="pronunciation"
            stroke={chartConfig.pronunciation.color}
            strokeWidth={3}
            dot={{ fill: chartConfig.pronunciation.color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: chartConfig.pronunciation.color, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="intonation"
            stroke={chartConfig.intonation.color}
            strokeWidth={3}
            dot={{ fill: chartConfig.intonation.color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: chartConfig.intonation.color, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
