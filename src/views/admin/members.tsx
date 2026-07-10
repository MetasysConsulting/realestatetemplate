"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { MOCK_MEMBERS } from "@/lib/admin/reovana-admin-data";
import { Bookmark, CreditCard, Home, Search, User } from "lucide-react";

const Members = () => {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(MOCK_MEMBERS[0]?.id ?? "");

  const filtered = MOCK_MEMBERS.filter(
    (m) =>
      !query ||
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase()),
  );

  const selected = MOCK_MEMBERS.find((m) => m.id === selectedId) ?? filtered[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Manage Members</h1>
        <p className="text-sm sm:text-base text-white/50 mt-1">
          View saved properties, posted listings, and payment history
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white text-base">Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filtered.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedId(member.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selected?.id === member.id
                    ? "border-primary/50 bg-primary/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <p className="font-medium text-white">{member.name}</p>
                <p className="text-xs text-white/50">{member.email}</p>
                <p className="text-xs text-primary mt-1">{member.plan}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {selected && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {selected.name}
              </CardTitle>
              <p className="text-sm text-white/50">{selected.email} · Joined {selected.joined}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <Bookmark className="h-5 w-5 text-primary mb-2" />
                  <p className="text-2xl font-bold text-white">{selected.savedProperties}</p>
                  <p className="text-sm text-white/50">Saved properties</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <Home className="h-5 w-5 text-primary mb-2" />
                  <p className="text-2xl font-bold text-white">{selected.postedProperties}</p>
                  <p className="text-sm text-white/50">Posted properties</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <CreditCard className="h-5 w-5 text-primary mb-2" />
                  <p className="text-2xl font-bold text-white">{selected.totalSpent}</p>
                  <p className="text-sm text-white/50">Total payments</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-2">Saved properties</h3>
                {selected.savedList.length === 0 ? (
                  <p className="text-sm text-white/40">No saved properties</p>
                ) : (
                  <div className="space-y-2">
                    {selected.savedList.map((item) => (
                      <div key={item.id} className="flex justify-between gap-2 p-3 rounded-lg bg-white/5 border border-white/10 text-sm">
                        <div>
                          <p className="text-white font-medium">{item.title}</p>
                          <p className="text-white/40 font-mono text-xs">{item.id}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-primary">{item.price}</p>
                          <p className="text-white/40 text-xs">{item.savedAt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-2">Posted properties</h3>
                {selected.postedList.length === 0 ? (
                  <p className="text-sm text-white/40">No posted listings</p>
                ) : (
                  <div className="space-y-2">
                    {selected.postedList.map((item) => (
                      <div key={item.id} className="flex justify-between gap-2 p-3 rounded-lg bg-white/5 border border-white/10 text-sm">
                        <div>
                          <p className="text-white font-medium">{item.title}</p>
                          <p className="text-white/40 font-mono text-xs">{item.id}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-primary">{item.price}</p>
                          <p className="text-xs text-white/50">{item.status} · {item.postedAt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-2">Payment history</h3>
                {selected.payments.length === 0 ? (
                  <p className="text-sm text-white/40">No payments yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-white/50 border-b border-white/10">
                          <th className="pb-2 pr-4">Date</th>
                          <th className="pb-2 pr-4">Description</th>
                          <th className="pb-2 pr-4">Amount</th>
                          <th className="pb-2">Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.payments.map((payment) => (
                          <tr key={payment.id} className="border-b border-white/5">
                            <td className="py-2 pr-4 text-white/70">{payment.date}</td>
                            <td className="py-2 pr-4 text-white">{payment.description}</td>
                            <td className="py-2 pr-4 text-primary font-medium">{payment.amount}</td>
                            <td className="py-2 text-white/50">{payment.method}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Members;
