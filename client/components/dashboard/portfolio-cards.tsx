"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

type Data = {
  totalDeposited: number;
  totalBorrowed: number;
  availableToBorrow: number;
  healthFactor: number; // 0-100
};

export function PortfolioCards({
  loading,
  data,
}: {
  loading: boolean;
  data?: Data;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-black/10">
            <CardContent className="p-4">
              <Skeleton
                className="mb-3 h-4 w-24"
                style={{ backgroundColor: "#f0f0f0" }}
              />
              <Skeleton
                className="h-7 w-28"
                style={{ backgroundColor: "#f0f0f0" }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Deposited"
        value={formatUSD(data?.totalDeposited ?? 0)}
      />
      <MetricCard
        title="Total Borrowed"
        value={formatUSD(data?.totalBorrowed ?? 0)}
      />
      <MetricCard
        title="Available to Borrow"
        value={formatUSD(data?.availableToBorrow ?? 0)}
      />
      <HealthCard value={data?.healthFactor ?? 0} />
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="border-black/10 transition-transform duration-300 hover:scale-[1.02] hover:shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm" style={{ color: "#666666" }}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function HealthCard({ value }: { value: number }) {
  return (
    <Card className="border-black/10 transition-transform duration-300 hover:scale-[1.02] hover:shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm" style={{ color: "#666666" }}>
          Health Factor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2 text-xl font-semibold">{value.toFixed(0)}%</div>
        <Progress value={value} className="h-2 transition-[width]" />
      </CardContent>
    </Card>
  );
}

function formatUSD(n: number) {
  return Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}
