"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Check, Crown, Zap, Rocket, Star, Shield, Clock, Users, Sparkles, TrendingUp, CreditCard, Calendar, ArrowRight, Info } from "lucide-react";
import { SUBSCRIPTION_FAQ } from "@/lib/admin/reovana-admin-data";

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Browse blurred listings and explore all categories",
    icon: Zap,
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    features: [
      { text: "Browse all property categories", included: true },
      { text: "Basic search & filters", included: true },
      { text: "Learn guides & FAQs", included: true },
      { text: "Property unlocks", included: false },
      { text: "Saved searches", included: false },
      { text: "Priority alerts", included: false },
      { text: "CSV export", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "View on site",
    popular: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "Unlimited unlocks for active investors",
    icon: Rocket,
    color: "from-primary/30 to-purple-500/30",
    borderColor: "border-primary/50",
    iconBg: "bg-primary/20",
    iconColor: "text-primary",
    features: [
      { text: "Unlimited property unlocks", included: true },
      { text: "Full address & contact details", included: true },
      { text: "Saved searches & alerts", included: true },
      { text: "HUD & auction detail pages", included: true },
      { text: "Export saved lists (CSV)", included: true },
      { text: "Priority email support", included: true },
      { text: "Equity estimate snapshots", included: true },
      { text: "Per-unlock fees waived", included: true },
    ],
    cta: "Manage plan",
    popular: true,
  },
  {
    name: "Per Unlock",
    price: "$9",
    period: "/property",
    description: "Pay once for a single property detail",
    icon: Crown,
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    features: [
      { text: "One full property unlock", included: true },
      { text: "Address & owner contact", included: true },
      { text: "Equity estimate snapshot", included: true },
      { text: "No subscription required", included: true },
      { text: "Bulk unlock discounts", included: false },
      { text: "Unlimited access", included: false },
      { text: "Saved search alerts", included: false },
      { text: "CSV export", included: false },
    ],
    cta: "View pricing",
    popular: false,
  },
]

const usageStats = [
  {
    label: "Active Pro Members",
    value: "1,240",
    icon: Star,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Unlocks This Month",
    value: "1,847",
    icon: TrendingUp,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    label: "Unlock Revenue",
    value: "$16,020",
    icon: Calendar,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    label: "Subscription MRR",
    value: "$12,380",
    icon: CreditCard,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
]

const features = [
  {
    title: "Blurred preview",
    description: "Public site shows price and photos; address unlocks after payment",
    icon: Zap,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    title: "Secure checkout",
    description: "Stripe-ready flow for per-unlock and Pro subscription billing",
    icon: Shield,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    title: "Investor support",
    description: "Help buyers understand foreclosure stages and auction timelines",
    icon: Clock,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Nationwide coverage",
    description: "U.S. distressed inventory from HUD, VA REO, GSE, and auction feeds",
    icon: Users,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
]

const Subscription = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">REOVANA Plans & Billing</h1>
        <p className="text-sm sm:text-base text-white/50 mt-1">Public-site pricing for property unlocks and Pro subscriptions</p>
      </div>

      {/* Current Usage Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {usageStats.map((stat, index) => (
          <Card key={index} className="hover:border-primary/50 transition-all">
            <CardContent className="">
              <div className="flex items-center gap-3">
                <div className={`p-2 sm:p-3 rounded-xl ${stat.bg} border border-primary/20`}>
                  <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-base sm:text-lg font-bold text-white mt-0.5">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 my-9 gap-6">
        {pricingPlans.map((plan, index) => (
          <Card key={index} className={`relative overflow-hidden hover:border-primary/50 transition-all duration-300 ${plan.popular ? "border-primary/50 shadow-lg shadow-primary/20 lg:scale-105" : "" }`}>
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-linear-to-r from-primary to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">MOST POPULAR</div>
            )}

            <CardHeader className="text-center space-y-4">
              <div className={`mx-auto p-4 rounded-2xl ${plan.iconBg} border ${plan.borderColor} w-fit`}>
                <plan.icon className={`h-8 w-8 ${plan.iconColor}`} />
              </div>

              <div>
                <CardTitle className="text-2xl text-white mb-2">{plan.name}</CardTitle>
                <p className="text-sm text-white/50">{plan.description}</p>
              </div>

              <div className="flex items-end justify-center gap-1">
                <span className="text-4xl sm:text-5xl font-bold text-white">{plan.price}</span>
                <span className="text-white/50 mb-2 text-sm sm:text-base">{plan.period}</span>
              </div>

              <Button
                className={`w-full ${plan.popular
                    ? "bg-linear-to-r from-primary to-purple-500 text-white hover:from-purple-500 hover:to-primary"
                    : ""
                  }`}
                variant={plan.popular ? "default" : "outline"}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 p-1 rounded-full ${feature.included
                          ? "bg-primary/20 border border-primary/30"
                          : "bg-white/5 border border-white/10"
                        }`}
                    >
                      <Check className={`h-3 w-3 ${feature.included ? "text-primary" : "text-white/40"}`}/>
                    </div>
                    <span className={`text-sm ${feature.included ? "text-slate-200" : "text-white/50" }`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Grid */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Why investors choose REOVANA</CardTitle>
          <p className="text-white/50 mt-2">Distressed inventory, blurred previews, and paid unlocks for serious buyers</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="text-center space-y-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/40 transition-all">
                <div className={`mx-auto w-fit p-4 rounded-xl ${feature.bg} border border-primary/20`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-white/50">{feature.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SUBSCRIPTION_FAQ.map((item) => (
              <div key={item.q} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 mt-1">
                    <Info className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{item.q}</h4>
                    <p className="text-sm text-white/50">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="bg-linear-to-r from-primary/10 to-purple-500/10 border-primary/30">
        <CardContent className="py-6 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Preview public pricing</h2>
          <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto px-4">
            These plans mirror what investors see on the REOVANA marketplace. Wire Stripe when backend is ready.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="bg-linear-to-r from-primary to-sidebar-primary text-white w-full sm:w-auto" asChild>
              <a href="/" target="_blank" rel="noopener noreferrer"><Sparkles className="h-5 w-5" /> Open public site</a>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <a href="/admin/settings">Edit display settings</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Subscription;
