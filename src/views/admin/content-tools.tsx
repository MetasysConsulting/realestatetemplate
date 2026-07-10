"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import {
  Search,
  FileText,
  Database,
  Building2,
  Filter,
  TrendingUp,
  Download,
  Calendar,
  List,
  Tag,
  BarChart3,
  FileSpreadsheet,
  Users,
  Settings,
  ChevronRight,
  ArrowRight,
  Activity,
  Home,
  Grid3x3,
  RefreshCw,
} from "lucide-react";
import colorMap from "@/lib/admin/colorMap.json";
import { formatAdminListingsCount } from "@/lib/admin/admin-listings-types";

type ColorKey =
  | "blue-500"
  | "purple-500"
  | "green-500"
  | "primary"
  | "amber-500"
  | "pink-500"
  | "cyan-500"
  | "rose-500"
  | "indigo-500"
  | "teal-500"
  | "violet-500";

const typedColorMap = colorMap as Record<
  ColorKey,
  { bg: string; border: string; hoverBorder: string; text: string }
>;

type Tool = {
  name: string;
  icon: typeof Building2;
  desc: string;
  href: string;
};

type ToolCategory = {
  id: string;
  name: string;
  icon: typeof Building2;
  color: ColorKey;
  tools: Tool[];
};

const toolCategories: ToolCategory[] = [
  {
    id: "listings",
    name: "Listing Management",
    icon: Building2,
    color: "blue-500",
    tools: [
      {
        name: "Browse Inventory",
        icon: Building2,
        desc: "Paginated live listings",
        href: "/admin/listings",
      },
      {
        name: "HUD Homes",
        icon: FileText,
        desc: "Filter HUD source inventory",
        href: "/admin/listings?source=hud",
      },
      {
        name: "PropertyRadar",
        icon: Tag,
        desc: "Largest scrape source",
        href: "/admin/listings?source=propertyradar",
      },
      {
        name: "Inactive Listings",
        icon: List,
        desc: "Review deactivated rows",
        href: "/admin/listings?active=0",
      },
    ],
  },
  {
    id: "feeds",
    name: "Data Sources & Scrapers",
    icon: RefreshCw,
    color: "purple-500",
    tools: [
      {
        name: "Data Sources",
        icon: Database,
        desc: "Feed health and counts",
        href: "/admin/data-sources",
      },
      {
        name: "Inventory Analytics",
        icon: Activity,
        desc: "Scrape KPIs by source",
        href: "/admin/analytics",
      },
      {
        name: "Dashboard",
        icon: Home,
        desc: "Ops overview",
        href: "/admin/dashboard",
      },
      {
        name: "VA / VRM Feed",
        icon: TrendingUp,
        desc: "Open VRM listings",
        href: "/admin/listings?source=vrm",
      },
    ],
  },
  {
    id: "search",
    name: "Search & Filters",
    icon: Search,
    color: "green-500",
    tools: [
      {
        name: "Search Miami",
        icon: Search,
        desc: "City / address filter",
        href: "/admin/listings?q=miami",
      },
      {
        name: "Florida Inventory",
        icon: Filter,
        desc: "State filter",
        href: "/admin/listings?q=FL",
      },
      {
        name: "Foreclosures",
        icon: Calendar,
        desc: "Category filter",
        href: "/admin/listings?category=foreclosure",
      },
      {
        name: "Header Search",
        icon: Search,
        desc: "Use the top bar anytime",
        href: "/admin/listings",
      },
    ],
  },
  {
    id: "members",
    name: "Members & Activity",
    icon: Users,
    color: "primary",
    tools: [
      {
        name: "Manage Members",
        icon: Users,
        desc: "Profiles and sign-ins",
        href: "/admin/members",
      },
      {
        name: "Site Activity",
        icon: Activity,
        desc: "Visitors, unlocks, trends",
        href: "/admin/home",
      },
      {
        name: "Unlock Intents",
        icon: BarChart3,
        desc: "Activity unlock events",
        href: "/admin/home",
      },
      {
        name: "Admin Settings",
        icon: Settings,
        desc: "Password and profile",
        href: "/admin/settings",
      },
    ],
  },
  {
    id: "export",
    name: "Reports & Ops",
    icon: Download,
    color: "amber-500",
    tools: [
      {
        name: "Listings Table",
        icon: FileSpreadsheet,
        desc: "Filter then copy IDs",
        href: "/admin/listings",
      },
      {
        name: "Feed Health",
        icon: FileText,
        desc: "Source scrape status",
        href: "/admin/data-sources",
      },
      {
        name: "Category Mix",
        icon: BarChart3,
        desc: "Inventory by category",
        href: "/admin/analytics",
      },
      {
        name: "HomeSteps",
        icon: Building2,
        desc: "Freddie Mac REO",
        href: "/admin/listings?source=homesteps",
      },
    ],
  },
];

type ContentToolsProps = {
  stats: {
    activeListings: number;
    sourcesWithListings: number;
    categories: number;
    tools: number;
  };
};

export default function ContentTools({ stats }: ContentToolsProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeView, setActiveView] = useState<"grid" | "list">("grid");

  const filteredTools = useMemo(() => {
    return toolCategories.filter((category) => {
      if (selectedCategory !== "all" && category.id !== selectedCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        category.name.toLowerCase().includes(q) ||
        category.tools.some(
          (tool) =>
            tool.name.toLowerCase().includes(q) || tool.desc.toLowerCase().includes(q),
        )
      );
    });
  }, [searchQuery, selectedCategory]);

  const openTool = (href: string) => {
    router.push(href);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Listing Tools</h1>
          <p className="text-sm sm:text-base text-white/50 mt-1">
            Shortcuts into live inventory, feeds, members, and activity
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-primary/30 text-slate-300 hover:bg-primary/10"
          onClick={() => setActiveView(activeView === "grid" ? "list" : "grid")}
        >
          {activeView === "grid" ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
          <span className="hidden sm:inline">
            {activeView === "grid" ? "List" : "Grid"} View
          </span>
        </Button>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 pt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
              <Input
                placeholder="Search tools..."
                value={searchQuery}
                className="pl-10 bg-white/10 border-white/20 text-slate-200 placeholder:text-white/30"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                className={
                  selectedCategory === "all"
                    ? "bg-primary text-white"
                    : "border-primary/30 text-slate-300"
                }
                onClick={() => setSelectedCategory("all")}
              >
                All Tools
              </Button>
              {toolCategories.map((category) => (
                <Button
                  key={category.id}
                  size="sm"
                  className={
                    selectedCategory === category.id
                      ? "bg-primary text-white"
                      : "border-primary/30 text-slate-300"
                  }
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <category.icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{category.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid xs:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-white/50 uppercase tracking-wider">Active listings</p>
            <p className="text-2xl font-bold text-white mt-1">
              {formatAdminListingsCount(stats.activeListings)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-white/50 uppercase tracking-wider">Live sources</p>
            <p className="text-2xl font-bold text-white mt-1">
              {formatAdminListingsCount(stats.sourcesWithListings)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-white/50 uppercase tracking-wider">Categories</p>
            <p className="text-2xl font-bold text-white mt-1">
              {formatAdminListingsCount(stats.categories)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-white/50 uppercase tracking-wider">Ops shortcuts</p>
            <p className="text-2xl font-bold text-white mt-1">
              {formatAdminListingsCount(stats.tools)}
            </p>
          </CardContent>
        </Card>
      </div>

      {activeView === "grid" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTools.map((category) => {
            const colors = typedColorMap[category.color] ?? typedColorMap.primary;
            return (
              <Card key={category.id} className="hover:border-primary/50 transition-all group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${colors.bg} border ${colors.border}`}
                      >
                        <category.icon className={`h-6 w-6 ${colors.text}`} />
                      </div>
                      <div>
                        <CardTitle className="text-white text-base">{category.name}</CardTitle>
                        <p className="text-sm text-white/50 mt-0.5">
                          {category.tools.length} shortcuts
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.tools.map((tool) => (
                      <button
                        key={tool.name}
                        type="button"
                        onClick={() => openTool(tool.href)}
                        className="w-full text-left group/tool flex items-start gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all"
                      >
                        <div className="p-1.5 rounded-md bg-white/5 border border-white/10 group-hover/tool:bg-primary/10 group-hover/tool:border-primary/30 transition-all">
                          <tool.icon className="h-5 w-5 text-white/50 group-hover/tool:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 group-hover/tool:text-white transition-colors flex items-center gap-2">
                            {tool.name}
                            <ArrowRight className="h-3 w-3 opacity-0 group-hover/tool:opacity-100 transition-opacity" />
                          </p>
                          <p className="text-sm text-white/50 mt-0.5">{tool.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-primary/10">
              {filteredTools.map((category) => {
                const colors = typedColorMap[category.color] ?? typedColorMap.primary;
                return (
                  <div key={category.id} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-slate-800/60 border border-primary/20">
                        <category.icon className={`h-4 w-4 ${colors.text}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{category.name}</h3>
                        <p className="text-xs text-white/50">
                          {category.tools.length} shortcuts
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-12">
                      {category.tools.map((tool) => (
                        <button
                          key={tool.name}
                          type="button"
                          onClick={() => openTool(tool.href)}
                          className="text-left flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-primary/10 hover:border-primary/30 transition-all group"
                        >
                          <tool.icon className="h-3.5 w-3.5 text-white/50 group-hover:text-primary shrink-0" />
                          <p className="text-xs font-medium text-slate-200 truncate">
                            {tool.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredTools.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No tools found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search or filter</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
