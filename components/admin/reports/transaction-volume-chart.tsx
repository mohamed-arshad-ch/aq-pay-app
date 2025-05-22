"use client";

import { useAppSelector } from "@/store/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { LineChart, Line } from "recharts";

export function TransactionVolumeChart() {
  const { data } = useAppSelector((state) => state.reports.transactionVolume);

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Volume</CardTitle>
          <CardDescription>
            No transaction volume data available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">
              Please select a different date range or try again later
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for recharts
  const transformedData = data.labels.map((label, index) => {
    const dataPoint: any = { name: label };
    data.datasets.forEach((dataset) => {
      dataPoint[dataset.label] = dataset.data[index];
    });
    return dataPoint;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Volume</CardTitle>
        <CardDescription>Transaction volume over time</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bar" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            <TabsTrigger value="line">Line Chart</TabsTrigger>
          </TabsList>
          <TabsContent value="bar">
            <ChartContainer
              config={{
                Completed: {
                  label: "Completed",
                  color: "hsl(var(--chart-1))",
                },
                Pending: {
                  label: "Pending",
                  color: "hsl(var(--chart-2))",
                },
                Failed: {
                  label: "Failed",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[400px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={transformedData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="Completed" fill="var(--color-Completed)" />
                  <Bar dataKey="Pending" fill="var(--color-Pending)" />
                  <Bar dataKey="Failed" fill="var(--color-Failed)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="line">
            <ChartContainer
              config={{
                Completed: {
                  label: "Completed",
                  color: "hsl(var(--chart-1))",
                },
                Pending: {
                  label: "Pending",
                  color: "hsl(var(--chart-2))",
                },
                Failed: {
                  label: "Failed",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[400px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={transformedData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Completed"
                    stroke="var(--color-Completed)"
                  />
                  <Line
                    type="monotone"
                    dataKey="Pending"
                    stroke="var(--color-Pending)"
                  />
                  <Line
                    type="monotone"
                    dataKey="Failed"
                    stroke="var(--color-Failed)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
