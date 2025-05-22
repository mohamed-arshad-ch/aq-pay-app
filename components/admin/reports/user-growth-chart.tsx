"use client";

import { useAppSelector } from "@/store/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function UserGrowthChart() {
  const { data } = useAppSelector((state) => state.reports.userGrowth);

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>No user growth data available</CardDescription>
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

  // Calculate cumulative new users
  const cumulativeData = data.labels.map((label, index) => {
    const dataPoint: any = { name: label };
    let cumulativeSum = 0;
    data.datasets.forEach((dataset, datasetIndex) => {
      if (dataset.label === "New Users") {
        for (let i = 0; i <= index; i++) {
          cumulativeSum += dataset.data[i];
        }
        dataPoint["Cumulative Users"] = cumulativeSum;
      } else {
        dataPoint[dataset.label] = dataset.data[index];
      }
    });
    return dataPoint;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Growth</CardTitle>
        <CardDescription>User growth trends over time</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="daily">Daily Growth</TabsTrigger>
            <TabsTrigger value="cumulative">Cumulative Growth</TabsTrigger>
          </TabsList>
          <TabsContent value="daily">
            <ChartContainer
              config={{
                "New Users": {
                  label: "New Users",
                  color: "hsl(var(--chart-1))",
                },
                "Active Users": {
                  label: "Active Users",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[400px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={transformedData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="New Users"
                    stroke="var(--color-New Users)"
                    fill="var(--color-New Users)"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="Active Users"
                    stroke="var(--color-Active Users)"
                    fill="var(--color-Active Users)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="cumulative">
            <ChartContainer
              config={{
                "Cumulative Users": {
                  label: "Cumulative Users",
                  color: "hsl(var(--chart-1))",
                },
                "Active Users": {
                  label: "Active Users",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[400px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={cumulativeData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="Cumulative Users"
                    stroke="var(--color-Cumulative Users)"
                    fill="var(--color-Cumulative Users)"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="Active Users"
                    stroke="var(--color-Active Users)"
                    fill="var(--color-Active Users)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
