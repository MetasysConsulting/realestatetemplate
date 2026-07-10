"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/admin/ui/chart";
import { XAxis, YAxis, Bar, BarChart, Line, LineChart, Area, AreaChart, CartesianGrid } from "recharts";
import { TrendingUp, Download, Calendar, Activity, Server, AlertCircle, CheckCircle2, ArrowUpRight, RefreshCw } from "lucide-react";
import {
  adminChartConfig as chartConfig,
  analyticsKeyMetrics as keyMetrics,
  revenueData,
  trafficData as apiUsageData,
  scraperPerformance as systemPerformance,
  subscriptionMetrics,
  topSiteFeatures as featureUsage,
} from "@/lib/admin/reovana-admin-data";
const colorConfig = {
  "green-500": {
    bg: "bg-gradient-to-br from-green-500/20 to-green-500/5",
    border: "border-green-500/30",
    text: "text-green-500",
  },
  "blue-500": {
    bg: "bg-gradient-to-br from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/30",
    text: "text-blue-500",
  },
  "purple-500": {
    bg: "bg-gradient-to-br from-purple-500/20 to-purple-500/5",
    border: "border-purple-500/30",
    text: "text-purple-500",
  },
  "emerald-500": {
    bg: "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/30",
    text: "text-emerald-500",
  },
}
const Analytics = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">REOVANA Analytics</h1>
          <p className="text-sm sm:text-base text-white/50 mt-1">Traffic, unlock revenue, subscriptions, and data feed health</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-primary/50 text-slate-200 hover:bg-primary/10 hover:border-primary">
            <Calendar className="h-4 w-4 " />
            <span className="hidden sm:inline">Last 7 days</span>
          </Button>
          <Button className="bg-linear-to-r from-primary to-sidebar-primary hover:from-sidebar-primary hover:to-primary text-white border-0">
            <Download className="h-4 w-4 " />
            <span className="hidden sm:inline">Export Data</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {keyMetrics.map((metric, index) => {
          const colors = colorConfig[metric.color as keyof typeof colorConfig];
          return (
            <Card key={index} className="relative overflow-hidden hover:border-primary/50 transition-all duration-300 backdrop-blur-sm group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-white/50 uppercase tracking-wider">{metric.title}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{metric.value}</p>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-xl ${colors.bg} ${colors.border} border group-hover:scale-110 transition-transform`}>
                    <metric.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.text}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/50">{metric.subtext}</p>
                  <div className={`flex items-center gap-1 ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    <ArrowUpRight className="h-3 w-3" />
                    <span className="text-sm font-semibold">{metric.change}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Trend */}
      <Card className="">
        <CardHeader>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div>
              <CardTitle className="text-white">Unlock Revenue & Costs</CardTitle>
              <p className="text-sm text-white/50 mt-1">Monthly unlock + subscription revenue vs operating costs</p>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-1 shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
                <span className="text-white/50">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-2 shadow-[0_0_8px_rgba(236,72,153,0.6)]"></div>
                <span className="text-white/50">Expenses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-3 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                <span className="text-white/50">Profit</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-linear-to-br from-primary/10 to-transparent border border-primary/10 shadow-inner">
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <AreaChart data={revenueData} margin={{ left: 0, right: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={60} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={3} fill="url(#colorRevenue)" dot={{ fill: "var(--chart-1)", r: 5, strokeWidth: 2, stroke: "#1e293b" }} />
                <Area type="monotone" dataKey="expenses" stroke="var(--chart-2)" strokeWidth={3} fill="url(#colorExpenses)" dot={{ fill: "var(--chart-2)", r: 5, strokeWidth: 2, stroke: "#1e293b" }} />
                <Area type="monotone" dataKey="profit" stroke="var(--chart-3)" strokeWidth={3} fill="url(#colorProfit)" dot={{ fill: "var(--chart-3)", r: 5, strokeWidth: 2, stroke: "#1e293b" }} />
              </AreaChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* API Usage & System Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Usage */}
        <Card >
          <CardHeader>
            <CardTitle className="text-white">Site Traffic</CardTitle>
            <p className="text-sm text-white/50 mt-1">Weekly listing views and unlock conversions</p>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-xl bg-linear-to-br from-blue-500/10 to-transparent border border-blue-500/10 shadow-inner">
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={apiUsageData} margin={{ left: 0, right: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={1} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="day" stroke="#64748b" fontSize="var(--chart-bottom-font-size)" tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="views" fill="url(#barGradient)" radius={[12, 12, 12, 12]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* System Performance */}
        <Card className="">
          <CardHeader>
            <CardTitle className="text-white">Scraper Feed Health</CardTitle>
            <p className="text-sm text-white/50 mt-1">Success vs failed sync jobs through the day</p>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-xl bg-linear-to-br from-pink-500/10 to-transparent border border-pink-500/10 shadow-inner">
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart data={systemPerformance} margin={{ left: 0, right: 0 }}>
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="success" stroke="var(--chart-1)" strokeWidth={3} dot={{ fill: "var(--chart-1)", r: 5, strokeWidth: 2, stroke: "#1e293b" }} activeDot={{ r: 7, strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="failed" stroke="var(--chart-2)" strokeWidth={3} dot={{ fill: "var(--chart-2)", r: 5, strokeWidth: 2, stroke: "#1e293b" }} activeDot={{ r: 7, strokeWidth: 2 }} />
                </LineChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Metrics & Feature Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Subscription Metrics */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-white">Pro Subscription Growth</CardTitle>
            <p className="text-sm text-white/50 mt-1">New Pro members vs churn each month</p>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-xl bg-linear-to-br from-green-500/10 to-transparent border border-green-500/10 shadow-inner">
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <BarChart data={subscriptionMetrics} margin={{ left: 0, right: 0 }} barGap={8}>
                  <defs>
                    <linearGradient id="newGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={1} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient id="churnGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={1} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" hide />
                  <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                  <Bar dataKey="new" fill="url(#newGradient)" radius={[10, 10, 10, 10]} />
                  <Bar dataKey="churned" fill="url(#churnGradient)" radius={[10, 10, 10, 10]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Features */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-white">Top Site Features</CardTitle>
            <p className="text-sm text-white/50 mt-1">Most visited areas on the public REOVANA site</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-7">
              {featureUsage.map((feature, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-200 font-medium">{feature.feature}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white/50">{feature.usage.toLocaleString()}</span>
                      <div className="flex items-center gap-1 text-green-500">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-xs font-semibold">{feature.growth}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 border border-primary/20 shadow-inner">
                    <div className="bg-linear-to-r from-primary via-primary to-sidebar-primary-foreground h-2 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                      style={{ width: `${(feature.usage / 8500) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  <p className="text-xs sm:text-sm font-medium text-slate-300">System Status</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white">Operational</p>
                <p className="text-sm text-white/50 mt-1">Public site and admin are online</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <Server className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  <p className="text-xs sm:text-sm font-medium text-slate-300">Data Feeds</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white">5 Active</p>
                <p className="text-sm text-white/50 mt-1">2,142 listings synced</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-yellow-500/5 sm:col-span-2 lg:col-span-1">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                  <p className="text-xs sm:text-sm font-medium text-slate-300">Active Alerts</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white">2 Feeds</p>
                <p className="text-sm text-white/50 mt-1">USDA & HomePath need attention</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Analytics;
