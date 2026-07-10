"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Search, Sparkles, FileText, Code, Database, Palette, Building2, Bot, Filter, TrendingUp, Download, Calendar, SlidersHorizontal, Grid3x3, List, ZoomIn, Maximize2, Brain, Edit3, Tag, MessageSquare, Share2, Paintbrush, RefreshCw, Bell, Plug, BarChart3, FileSpreadsheet, Image, Save, Users, Settings, ChevronRight, ArrowRight } from "lucide-react";
import colorMap from "@/lib/admin/colorMap.json";

// Define the type for color keys
type ColorKey = "blue-500" | "purple-500" | "green-500" | "primary" | "amber-500" | "pink-500" | "cyan-500" | "rose-500" | "indigo-500" | "teal-500" | "violet-500";

// Type assertion for the imported JSON
const typedColorMap = colorMap as Record<ColorKey, { bg: string; border: string; hoverBorder: string; text: string }>;

const toolCategories = [
  {
    id: "listings",
    name: "Listing Management",
    icon: Building2,
    color: "blue-500",
    tools: [
      { name: "Browse Inventory", icon: Building2, desc: "All distressed categories", prompt: "Show listing counts across REOVANA buy categories" },
      { name: "HUD Home Pages", icon: FileText, desc: "807 on-site detail pages", prompt: "Summarize HUD HomeStore inventory and sync status" },
      { name: "Category Tags", icon: Tag, desc: "Foreclosure, REO, auction", prompt: "Which property categories have the most inventory?" },
      { name: "Bulk Review", icon: List, desc: "Queue for moderation", prompt: "Help me review newly scraped listings before publish" },
    ]
  },
  {
    id: "feeds",
    name: "Data Sources & Scrapers",
    icon: RefreshCw,
    color: "purple-500",
    tools: [
      { name: "Run HUD Scraper", icon: RefreshCw, desc: "HUD HomeStore feed", prompt: "What is the status of the HUD HomeStore data feed?" },
      { name: "VA REO Feed", icon: Database, desc: "VRM properties", prompt: "Summarize VA REO listings and last sync time" },
      { name: "HomeSteps Feed", icon: TrendingUp, desc: "Freddie Mac REO", prompt: "How many HomeSteps listings are live?" },
      { name: "Blocked Sources", icon: Bell, desc: "USDA, HomePath", prompt: "Which data feeds are blocked and why?" },
    ]
  },
  {
    id: "search",
    name: "Search & Filters",
    icon: Search,
    color: "green-500",
    tools: [
      { name: "Property Search", icon: Search, desc: "Address, city, case #", prompt: "Help me find a listing by HUD case number or city" },
      { name: "State Filters", icon: Filter, desc: "Market-level views", prompt: "Which states have the highest foreclosure inventory?" },
      { name: "Auction Calendar", icon: Calendar, desc: "Upcoming sale dates", prompt: "Show upcoming auction and sheriff sale activity" },
      { name: "Saved Searches", icon: Save, desc: "Investor alert presets", prompt: "How do Pro users set up saved search alerts?" },
    ]
  },
  {
    id: "unlocks",
    name: "Unlocks & Revenue",
    icon: Sparkles,
    color: "primary",
    tools: [
      { name: "Unlock Report", icon: BarChart3, desc: "Per-property sales", prompt: "Summarize property unlock revenue this month" },
      { name: "Pro Members", icon: Users, desc: "Subscription accounts", prompt: "How many Pro subscribers do we have and what's churn?" },
      { name: "Conversion Funnel", icon: TrendingUp, desc: "Views to unlocks", prompt: "What is our listing view to unlock conversion rate?" },
      { name: "Pricing Review", icon: FileSpreadsheet, desc: "$9 unlock / $49 Pro", prompt: "Compare per-unlock vs Pro subscription revenue" },
    ]
  },
  {
    id: "export",
    name: "Reports & Export",
    icon: Download,
    color: "amber-500",
    tools: [
      { name: "Listing Export", icon: FileSpreadsheet, desc: "CSV of inventory", prompt: "Export current listing inventory to CSV" },
      { name: "Feed Health PDF", icon: FileText, desc: "Scraper status report", prompt: "Generate a data feed health report" },
      { name: "Revenue Summary", icon: Image, desc: "Monthly snapshot", prompt: "Create a monthly revenue summary for stakeholders" },
      { name: "Market Report", icon: Brain, desc: "Top states & categories", prompt: "Generate a top markets report for investors" },
    ]
  },
  {
    id: "content",
    name: "Listing Content",
    icon: Edit3,
    color: "pink-500",
    tools: [
      { name: "Description Writer", icon: Edit3, desc: "AI property blurbs", prompt: "Write a compelling listing description for a bank-owned home" },
      { name: "Equity Copy", icon: MessageSquare, desc: "Estimate explanations", prompt: "Explain how REOVANA equity estimates work to buyers" },
      { name: "Category Pages", icon: FileText, desc: "Buy menu content", prompt: "Review copy for foreclosure and HUD category pages" },
      { name: "Learn Articles", icon: Tag, desc: "Educational guides", prompt: "Suggest topics for new foreclosure education content" },
    ]
  },
  {
    id: "ai",
    name: "Admin AI Assistant",
    icon: Bot,
    color: "violet-500",
    tools: [
      { name: "Platform Summary", icon: Bot, desc: "Full site snapshot", prompt: "Summarize REOVANA platform metrics" },
      { name: "Feed Diagnostics", icon: Code, desc: "Scraper troubleshooting", prompt: "Which data feeds are blocked?" },
      { name: "Investor Insights", icon: TrendingUp, desc: "Market trends", prompt: "Top foreclosure markets this month" },
      { name: "Revenue Analysis", icon: BarChart3, desc: "Unlocks vs subs", prompt: "Unlock revenue vs subscriptions breakdown" },
    ]
  },
]
 
const ContentTools = () => {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeView, setActiveView] = useState<"grid" | "list">("grid")

  const handleToolClick = (prompt: string) => {
    // Store the prompt in sessionStorage to pass to chatbot
    sessionStorage.setItem("chatbotPrompt", prompt)
    router.push("/admin/chatbot")
  }

  const filteredTools = toolCategories.filter(category => {
    if (selectedCategory !== "all" && category.id !== selectedCategory) return false
    if (searchQuery) {
      return category.tools.some(tool =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.desc.toLowerCase().includes(searchQuery.toLowerCase())
      ) || category.name.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Listing Tools</h1>
          <p className="text-sm sm:text-base text-white/50 mt-1">Manage inventory, scrapers, unlocks, and listing content for REOVANA</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-primary/30 text-slate-300 hover:bg-primary/10"
            onClick={() => setActiveView(activeView === "grid" ? "list" : "grid")}
          >
            {activeView === "grid" ? <List className="h-4 w-4 " /> : <Grid3x3 className="h-4 w-4 " />}
            <span className="hidden sm:inline">{activeView === "grid" ? "List" : "Grid"} View</span>
          </Button>
          <Button className="bg-linear-to-r from-primary to-sidebar-primary hover:from-sidebar-primary hover:to-primary text-white border-0">
            <Settings className="h-4 w-4 " />
            <span className="hidden sm:inline">Customize Tools</span>
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
              <Input placeholder="Search tools..." value={searchQuery} className="pl-10 bg-white/10 border-white/20 text-slate-200 placeholder:text-white/30"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant={selectedCategory === "all" ? "default" : "outline"} size="sm" className={selectedCategory === "all" ? "bg-primary text-white" : "border-primary/30 text-slate-300"}
                onClick={() => setSelectedCategory("all")}
              >
                All Tools
              </Button>
              {toolCategories.slice(0, 5).map((category) => (
                <Button key={category.id} size="sm" className={selectedCategory === category.id ? "bg-primary text-white" : "border-primary/30 text-slate-300"}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <category.icon className="h-3 w-3 " />
                  <span className="hidden sm:inline">{category.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid xs:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:border-primary/50 transition-all">
          <CardContent className="">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Settings className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">28</p>
                <p className="text-sm text-white/50">Listing tools</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 transition-all">
          <CardContent className="">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Brain className="h-4 w-4 sm:h-6 sm:w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">9</p>
                <p className="text-sm text-white/50">Buy categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 transition-all">
          <CardContent className="">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <Plug className="h-4 w-4 sm:h-6 sm:w-6 text-green-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">7</p>
                <p className="text-sm text-white/50">Data feeds</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 transition-all">
          <CardContent className="">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Users className="h-4 w-4 sm:h-6 sm:w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">4</p>
                <p className="text-sm text-white/50">Admin AI prompts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tools Grid/List */}
      {activeView === "grid" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTools.map((category) => {
            const colors = typedColorMap[category.color as ColorKey] ?? typedColorMap["primary"]
            return (
              <Card key={category.id} className="hover:border-primary/50 transition-all group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colors.bg} border ${colors.border} ${colors.hoverBorder} transition-all`}>
                        <category.icon className={`h-6 w-6 ${colors.text}`} />
                      </div>
                      <div>
                        <CardTitle className="text-white text-base">{category.name}</CardTitle>
                        <p className="text-sm text-white/50 mt-0.5">{category.tools.length} tools</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.tools.map((tool, index) => (
                      <button key={index} onClick={() => handleToolClick(tool.prompt || `Help me with ${tool.name}`)} className="w-full text-left group/tool flex items-start gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all">
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
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-primary/10">
              {filteredTools.map((category) => {
                const colors = typedColorMap[category.color as ColorKey] ?? typedColorMap["primary"]
                return (
                  <div key={category.id} className="p-4 hover:bg-slate-800/40 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg bg-slate-800/60 border border-primary/20`}>
                        <category.icon className={`h-4 w-4 ${colors.text}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{category.name}</h3>
                        <p className="text-xs text-white/50">{category.tools.length} tools available</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-12">
                      {category.tools.map((tool, index) => (
                        <button key={index} onClick={() => handleToolClick(tool.prompt || `Help me with ${tool.name}`)} className="text-left flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 border border-primary/10 hover:border-primary/30 hover:bg-slate-800/60 transition-all group">
                          <tool.icon className="h-3.5 w-3.5 text-white/50 group-hover:text-primary transition-colors shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-200 truncate flex items-center gap-1">
                              {tool.name}
                              <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredTools.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No tools found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search or filter</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ContentTools;
