"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { MOCK_EMAIL_CAMPAIGNS, EMAIL_SUMMARY_STATS } from "@/lib/admin/reovana-admin-data";
import { Mail, Plus, Send } from "lucide-react";

const Emails = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Email Management</h1>
          <p className="text-sm sm:text-base text-white/50 mt-1">
            Campaigns, alerts, and automated member emails
          </p>
        </div>
        <Button className="bg-primary text-white">
          <Plus className="h-4 w-4" /> New campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-white/50">Sent this month</p>
            <p className="text-3xl font-bold text-white mt-1">{EMAIL_SUMMARY_STATS.sentThisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-white/50">Scheduled</p>
            <p className="text-3xl font-bold text-white mt-1">{EMAIL_SUMMARY_STATS.scheduled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-white/50">Avg open rate</p>
            <p className="text-3xl font-bold text-white mt-1">{EMAIL_SUMMARY_STATS.avgOpenRate}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/50 border-b border-white/10">
                <th className="pb-3 pr-4">Subject</th>
                <th className="pb-3 pr-4">Audience</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Send time</th>
                <th className="pb-3 pr-4">Opens</th>
                <th className="pb-3 pr-4">Recipients</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody>
              {MOCK_EMAIL_CAMPAIGNS.map((campaign) => (
                <tr key={campaign.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 pr-4 text-white font-medium">{campaign.subject}</td>
                  <td className="py-3 pr-4 text-white/70">{campaign.audience}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        campaign.status === "Sent"
                          ? "border-green-500/30 text-green-400"
                          : campaign.status === "Scheduled"
                            ? "border-amber-500/30 text-amber-400"
                            : campaign.status === "Automated"
                              ? "border-primary/30 text-primary"
                              : "border-white/20 text-white/50"
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-white/50">{campaign.sentAt}</td>
                  <td className="py-3 pr-4 text-white/70">{campaign.opens}</td>
                  <td className="py-3 pr-4 text-white/50">{campaign.recipients.toLocaleString()}</td>
                  <td className="py-3">
                    {campaign.status === "Draft" && (
                      <Button size="sm" variant="outline" className="border-primary/30">
                        <Send className="h-3 w-3" /> Send
                      </Button>
                    )}
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

export default Emails;
