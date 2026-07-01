"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface FeeChartProps {
  data: { month: string; collected: number }[];
}

export function FeeChart({ data }: FeeChartProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold font-display">Fee Collections</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Monthly collections this year (PKR)
        </p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            formatter={(value: number) => [
              `PKR ${value.toLocaleString()}`,
              "Collected",
            ]}
          />
          <Bar
            dataKey="collected"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            name="Collected"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}