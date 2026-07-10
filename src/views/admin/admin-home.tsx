"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/admin/ui/dialog";
import {
  HOME_CLOSED_LOANS_DEFAULT,
  HOME_CLOSED_LOANS_TOTAL,
  HOME_INCOME_SOURCES,
  HOME_LISTING_TYPE_STYLES,
  HOME_LOAN_FORM_NEW_COUNT,
  HOME_LOAN_LEADS,
  HOME_LOAN_LEADS_TO_BANKS,
  HOME_LOAN_LEADS_TO_BANKS_COUNT,
  HOME_MEMBER_STATS,
  HOME_NEW_LISTINGS_BREAKDOWN,
  HOME_NEW_LISTINGS_TODAY,
  HOME_NEW_USERS,
  HOME_PAGE_VIEWS,
  HOME_PAGE_VIEWS_TODAY,
  HOME_PAGE_VIEWS_WEEK,
  HOME_SALES_STATS,
  HOME_TOP_NEW_LISTINGS,
  type HomeListingType,
} from "@/lib/admin/reovana-admin-data";
import { ExternalLink, Plus } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/admin/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

const incomeChartConfig = {
  value: { label: "Revenue", color: "var(--chart-1)" },
};

/** Ascending so the largest bar renders at the top (Recharts vertical layout). */
const incomeChartData = [...HOME_INCOME_SOURCES].sort((a, b) => a.value - b.value);

type ClosedLoan = {
  id: string;
  lead: string;
  earned: string;
};

function StatCard({
  label,
  value,
  subtext,
  trend,
  dotColor = "bg-primary",
}: {
  label: string;
  value: string;
  subtext: string;
  trend: "up" | "neutral";
  dotColor?: string;
}) {
  return (
    <Card className="border-white/10 bg-[#151b2e] shadow-none">
      <CardContent className="p-3.5">
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
          <p className="text-sm text-white/55">{label}</p>
        </div>
        <p className="text-2xl font-bold text-white leading-tight">{value}</p>
        <p
          className={`text-xs mt-0.5 ${
            trend === "up" ? "text-emerald-400" : "text-white/40"
          }`}
        >
          {subtext}
        </p>
      </CardContent>
    </Card>
  );
}

function TypeBadge({ type }: { type: HomeListingType }) {
  const style = HOME_LISTING_TYPE_STYLES[type];
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-md text-sm font-medium ${style.bg} ${style.text}`}
    >
      {type}
    </span>
  );
}

const AdminHome = () => {
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [closedLoans, setClosedLoans] = useState<ClosedLoan[]>(HOME_CLOSED_LOANS_DEFAULT);
  const [addOpen, setAddOpen] = useState(false);
  const [manualLead, setManualLead] = useState("");
  const [manualEarned, setManualEarned] = useState("");

  const visibleUsers = showAllUsers ? HOME_NEW_USERS : HOME_NEW_USERS.slice(0, 5);

  const closedTotal = useMemo(() => {
    const sum = closedLoans.reduce((acc, loan) => {
      const n = Number(loan.earned.replace(/[$,]/g, ""));
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
    return sum > 0
      ? `$${sum.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
      : HOME_CLOSED_LOANS_TOTAL;
  }, [closedLoans]);

  const addClosedLoan = () => {
    if (!manualLead.trim()) return;
    setClosedLoans((prev) => [
      {
        id: `c-${Date.now()}`,
        lead: manualLead,
        earned: manualEarned
          ? `$${manualEarned.replace(/^\$/, "").replace(/,/g, "")}`
          : "$0",
      },
      ...prev,
    ]);
    setManualLead("");
    setManualEarned("");
    setAddOpen(false);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* Sales + New Members — compact stat rows */}
      <div className="space-y-4">
        <section className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-white/45">
            Sales
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {HOME_SALES_STATS.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                subtext={stat.subtext}
                trend={stat.trend}
              />
            ))}
          </div>

          <Card className="border-white/10 bg-[#151b2e] shadow-none">
            <CardHeader className="py-3 px-4 pb-1">
              <CardTitle className="text-white text-base font-semibold">
                Primary income sources for the REOVANA platform.
              </CardTitle>
              <p className="text-sm text-white/50 mt-0.5">Monthly revenue mix — this month</p>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <ChartContainer
                config={incomeChartConfig}
                className="h-[300px] w-full aspect-auto [&_.recharts-cartesian-axis-tick_text]:fill-white/60"
              >
                <BarChart
                  layout="vertical"
                  data={incomeChartData}
                  margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                  barCategoryGap="20%"
                >
                  <defs>
                    <linearGradient id="incomeBarGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="var(--sidebar-primary)" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    horizontal={false}
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="4 4"
                  />
                  <XAxis
                    type="number"
                    domain={[0, 12]}
                    ticks={[0, 3, 6, 9, 12]}
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="source"
                    width={128}
                    stroke="#64748b"
                    fontSize={13}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "rgba(255,255,255,0.75)" }}
                  />
                  <ChartTooltip
                    cursor={{ fill: "rgba(118, 149, 255, 0.08)" }}
                    content={
                      <ChartTooltipContent
                        formatter={(_value, _name, item) => (
                          <span className="font-medium text-white">
                            {item.payload.amount}
                          </span>
                        )}
                      />
                    }
                  />
                  <Bar
                    dataKey="value"
                    fill="url(#incomeBarGradient)"
                    radius={[0, 10, 10, 0]}
                    barSize={26}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-white/45">
            New Members
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {HOME_MEMBER_STATS.map((stat, i) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                subtext={stat.subtext}
                trend={stat.trend}
                dotColor={i < 3 ? "bg-emerald-400" : "bg-primary"}
              />
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wider text-white/45">
              Site Traffic
            </h2>
            <Link
              href="/admin/analytics"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Full analytics →
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <StatCard
              label="Page views today"
              value={HOME_PAGE_VIEWS_TODAY.toLocaleString()}
              subtext="▲ 8% vs yesterday"
              trend="up"
            />
            <StatCard
              label="Page views this week"
              value={HOME_PAGE_VIEWS_WEEK.toLocaleString()}
              subtext="▲ 12% vs last week"
              trend="up"
            />
            <StatCard
              label="Top page today"
              value={HOME_PAGE_VIEWS[0].page}
              subtext={`${HOME_PAGE_VIEWS[0].viewsToday.toLocaleString()} views`}
              trend="neutral"
            />
            <StatCard
              label="Avg. pages / session"
              value="4.2"
              subtext="▲ 0.3 vs last week"
              trend="up"
            />
          </div>
        </section>
      </div>

      {/* Page views by page */}
      <Card className="border-white/10 bg-[#151b2e] shadow-none">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 pb-1">
          <div>
            <CardTitle className="text-white text-base font-semibold">
              Page Views by Page
            </CardTitle>
            <p className="text-sm text-white/50 mt-0.5">
              Public REOVANA site — last 7 days
            </p>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto px-4 pb-3 pt-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-white/40 border-b border-white/10">
                <th className="pb-2.5 pr-3 font-medium">Page</th>
                <th className="pb-2.5 pr-3 font-medium">Path</th>
                <th className="pb-2.5 pr-3 font-medium text-right">Today</th>
                <th className="pb-2.5 pr-3 font-medium text-right">7 days</th>
                <th className="pb-2.5 pr-3 font-medium text-right">Trend</th>
                <th className="pb-2.5 font-medium min-w-[140px]">Share</th>
              </tr>
            </thead>
            <tbody>
              {HOME_PAGE_VIEWS.map((row) => (
                <tr key={row.id} className="border-b border-white/5">
                  <td className="py-2.5 pr-3 text-white font-medium">{row.page}</td>
                  <td className="py-2.5 pr-3 text-white/50 font-mono text-xs">{row.path}</td>
                  <td className="py-2.5 pr-3 text-white text-right tabular-nums">
                    {row.viewsToday.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-3 text-white font-medium text-right tabular-nums">
                    {row.viewsWeek.toLocaleString()}
                  </td>
                  <td
                    className={`py-2.5 pr-3 text-right tabular-nums ${
                      row.change >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {row.change >= 0 ? "▲" : "▼"} {Math.abs(row.change)}%
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${row.share}%` }}
                        />
                      </div>
                      <span className="text-white/50 text-xs tabular-nums w-10 text-right">
                        {row.share}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* New Users + Listings Today */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 border-white/10 bg-[#151b2e] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 pb-1">
            <CardTitle className="text-white text-base font-semibold">New Users</CardTitle>
            <button
              type="button"
              onClick={() => setShowAllUsers(!showAllUsers)}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {showAllUsers ? "Show top 5" : "Expand / View all →"}
            </button>
          </CardHeader>
          <CardContent className="overflow-x-auto px-4 pb-3 pt-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-white/40 border-b border-white/10">
                  <th className="pb-2.5 pr-3 font-medium">Name</th>
                  <th className="pb-2.5 pr-3 font-medium">Email</th>
                  <th className="pb-2.5 pr-3 font-medium">Joined</th>
                  <th className="pb-2.5 font-medium">Plan</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id} className="border-b border-white/5">
                    <td className="py-2.5 pr-3 text-white font-medium">{user.name}</td>
                    <td className="py-2.5 pr-3 text-white/60">{user.email}</td>
                    <td className="py-2.5 pr-3 text-white/50">{user.joined}</td>
                    <td className="py-2.5 text-white/80">{user.plan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#151b2e] shadow-none">
          <CardHeader className="py-3 px-4 pb-1">
            <CardTitle className="text-white text-base font-semibold">
              New Listings Today
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            <p className="text-3xl font-bold text-white leading-none">{HOME_NEW_LISTINGS_TODAY}</p>
            <p className="text-sm text-white/50 mt-0.5 mb-3">added to the site today</p>
            <div>
              {HOME_NEW_LISTINGS_BREAKDOWN.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-2.5 border-t border-white/10 text-sm"
                >
                  <span className="text-white/70">{row.label}</span>
                  <span className="text-white font-medium">{row.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-white/10 bg-[#151b2e] shadow-none flex flex-col">
          <CardHeader className="py-3 px-4 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base font-semibold">
                Loan Form Leads
              </CardTitle>
              <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                {HOME_LOAN_FORM_NEW_COUNT} new
              </span>
            </div>
            <p className="text-sm text-white/50">From &apos;Need a Loan&apos; form</p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col px-4 pb-3 pt-0">
            <div className="flex-1">
              {HOME_LOAN_LEADS.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between py-2.5 border-t border-white/10 text-sm"
                >
                  <span className="text-white font-medium">{lead.name}</span>
                  <span className="text-white/50">{lead.submitted}</span>
                </div>
              ))}
            </div>
            <button type="button" className="text-sm text-primary mt-2 text-left hover:text-primary/80">
              View all →
            </button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#151b2e] shadow-none flex flex-col">
          <CardHeader className="py-3 px-4 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base font-semibold">
                Submitted to Banks
              </CardTitle>
              <span className="text-xs font-medium h-5 w-5 flex items-center justify-center rounded-full bg-primary/20 text-primary">
                {HOME_LOAN_LEADS_TO_BANKS_COUNT}
              </span>
            </div>
            <p className="text-sm text-white/50">Leads sent to lenders</p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col px-4 pb-3 pt-0">
            <div className="flex-1">
              {HOME_LOAN_LEADS_TO_BANKS.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-2 py-2.5 border-t border-white/10 text-sm"
                >
                  <span className="text-white">
                    {row.lead} → {row.bank}
                  </span>
                  <span className="text-white/50 shrink-0">{row.status}</span>
                </div>
              ))}
            </div>
            <button type="button" className="text-sm text-primary mt-2 text-left hover:text-primary/80">
              View all →
            </button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#151b2e] shadow-none flex flex-col">
          <CardHeader className="py-3 px-4 pb-1">
            <CardTitle className="text-white text-base font-semibold">Closed Loans</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col px-4 pb-3 pt-0">
            <p className="text-2xl font-bold text-emerald-400 leading-none">{closedTotal}</p>
            <p className="text-sm text-white/50 mb-2">earned from closed loan leads</p>
            <div className="flex-1">
              {closedLoans.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between py-2.5 border-t border-white/10 text-sm"
                >
                  <span className="text-white font-medium">{deal.lead}</span>
                  <span className="text-emerald-400 font-medium">{deal.earned}</span>
                </div>
              ))}
            </div>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full mt-2 h-9 text-sm bg-primary hover:bg-primary/90 text-white">
                  <Plus className="h-3.5 w-3.5" /> Add closed loan
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#151b2e] border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Add closed loan</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <Input
                    placeholder="Lead name"
                    value={manualLead}
                    onChange={(e) => setManualLead(e.target.value)}
                  />
                  <Input
                    placeholder="Amount earned ($)"
                    value={manualEarned}
                    onChange={(e) => setManualEarned(e.target.value)}
                  />
                  <Button className="w-full" onClick={addClosedLoan}>
                    Save
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 New Listings */}
      <Card className="border-white/10 bg-[#151b2e] shadow-none">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 pb-1">
          <CardTitle className="text-white text-base font-semibold">
            Top 5 New Listings
          </CardTitle>
          <Link
            href="/admin/listings"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View all listings →
          </Link>
        </CardHeader>
        <CardContent className="overflow-x-auto px-4 pb-3 pt-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-white/40 border-b border-white/10">
                <th className="pb-2.5 pr-3 font-medium">Address</th>
                <th className="pb-2.5 pr-3 font-medium">Type</th>
                <th className="pb-2.5 pr-3 font-medium">Price</th>
                <th className="pb-2.5 pr-3 font-medium">Added</th>
                <th className="pb-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {HOME_TOP_NEW_LISTINGS.map((listing) => (
                <tr key={listing.id} className="border-b border-white/5">
                  <td className="py-2.5 pr-3 text-white">{listing.address}</td>
                  <td className="py-2.5 pr-3">
                    <TypeBadge type={listing.category} />
                  </td>
                  <td className="py-2.5 pr-3 text-white font-medium">{listing.price}</td>
                  <td className="py-2.5 pr-3 text-white/50">{listing.added}</td>
                  <td className="py-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-primary/40 text-primary hover:bg-primary/10 h-8 text-sm px-2.5"
                      asChild
                    >
                      <Link href={`/admin/home/listing/${encodeURIComponent(listing.id)}`}>
                        Open <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHome;
