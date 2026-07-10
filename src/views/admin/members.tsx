"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { Button } from "@/components/admin/ui/button";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import {
  buildAdminMembersHref,
  formatMemberCount,
  formatMemberDate,
  formatMemberRelative,
  type AdminMember,
  type AdminMembersData,
} from "@/lib/admin/admin-members-types";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Phone,
  Search,
  Unlock,
  User,
  Users,
} from "lucide-react";

type MembersProps = {
  data: AdminMembersData;
};

export default function Members({ data }: MembersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [queryDraft, setQueryDraft] = useState(data.query.q);
  const [selectedId, setSelectedId] = useState(data.members[0]?.id ?? "");

  useEffect(() => {
    setQueryDraft(data.query.q);
  }, [data.query.q]);

  useEffect(() => {
    if (data.members.length === 0) {
      setSelectedId("");
      return;
    }
    if (!data.members.some((m) => m.id === selectedId)) {
      setSelectedId(data.members[0].id);
    }
  }, [data.members, selectedId]);

  const selected: AdminMember | undefined = useMemo(
    () => data.members.find((m) => m.id === selectedId) ?? data.members[0],
    [data.members, selectedId],
  );

  const navigate = (overrides: Parameters<typeof buildAdminMembersHref>[0]) => {
    const href = buildAdminMembersHref(overrides, data.query);
    startTransition(() => router.push(href));
  };

  const onSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    navigate({ q: queryDraft.trim(), page: 1 });
  };

  const rangeStart =
    data.filteredTotal === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const rangeEnd = Math.min(data.page * data.pageSize, data.filteredTotal);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Manage Members</h1>
        <p className="text-sm sm:text-base text-white/50 mt-1">
          Registered accounts from Supabase Auth and profiles
        </p>
      </div>

      {!data.available ? (
        <Card>
          <CardContent className="pt-6">
            <AdminEmptyState
              title="Members unavailable"
              description="Could not reach member profiles. Check database connection on this deployment."
            />
          </CardContent>
        </Card>
      ) : data.total === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <AdminEmptyState
              title="No members yet"
              description="When users register on the public site, their profiles will appear here."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-white/50 mb-2">
                  <Users className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-wider">Total members</p>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatMemberCount(data.total)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-white/50 mb-2">
                  <Mail className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-wider">Email confirmed</p>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatMemberCount(data.confirmedTotal)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-white/50 mb-2">
                  <User className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-wider">Signed in (30d)</p>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatMemberCount(data.signedIn30dTotal)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-white/50 mb-2">
                  <Unlock className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-wider">Unlock intents</p>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatMemberCount(data.unlockIntentsTotal)}
                </p>
              </CardContent>
            </Card>
          </div>

          <form onSubmit={onSearchSubmit} className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              className="pl-9"
              value={queryDraft}
              onChange={(e) => setQueryDraft(e.target.value)}
            />
          </form>

          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isPending ? "opacity-70" : ""}`}>
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-white text-base">
                  Members ({formatMemberCount(data.filteredTotal)})
                </CardTitle>
                <p className="text-xs text-white/40">
                  {data.filteredTotal === 0
                    ? "No matches"
                    : `Showing ${formatMemberCount(rangeStart)}–${formatMemberCount(rangeEnd)}`}
                </p>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {data.members.length === 0 ? (
                  <p className="text-sm text-white/45 py-4 text-center">No matches.</p>
                ) : (
                  data.members.map((member) => (
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
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-white truncate">{member.fullName}</p>
                        <span
                          className={`shrink-0 text-[10px] uppercase tracking-wide ${
                            member.emailConfirmed ? "text-green-400" : "text-amber-400"
                          }`}
                        >
                          {member.emailConfirmed ? "Verified" : "Pending"}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 truncate">{member.email}</p>
                      <p className="text-xs text-white/35 mt-1">
                        Joined {formatMemberDate(member.createdAt)} · Last active{" "}
                        {formatMemberRelative(member.lastSignInAt)}
                      </p>
                    </button>
                  ))
                )}
              </CardContent>
              {data.totalPages > 1 ? (
                <div className="flex items-center justify-between gap-2 px-6 pb-6">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={data.page <= 1 || isPending}
                    onClick={() => navigate({ page: data.page - 1 })}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <p className="text-xs text-white/45">
                    Page {data.page} / {data.totalPages}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={data.page >= data.totalPages || isPending}
                    onClick={() => navigate({ page: data.page + 1 })}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </Card>

            {selected ? (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {selected.fullName}
                  </CardTitle>
                  <p className="text-sm text-white/50">
                    Member since {formatMemberDate(selected.createdAt)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 text-white/50 mb-2">
                        <Mail className="h-4 w-4" />
                        <p className="text-xs uppercase tracking-wider">Email</p>
                      </div>
                      <p className="text-white break-all">{selected.email || "—"}</p>
                      <p className="text-xs mt-2">
                        {selected.emailConfirmed ? (
                          <span className="text-green-400">Confirmed</span>
                        ) : (
                          <span className="text-amber-400">Not confirmed</span>
                        )}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 text-white/50 mb-2">
                        <Phone className="h-4 w-4" />
                        <p className="text-xs uppercase tracking-wider">Phone</p>
                      </div>
                      <p className="text-white">{selected.phone || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
                        Last sign-in
                      </p>
                      <p className="text-white font-medium">
                        {formatMemberRelative(selected.lastSignInAt)}
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        {formatMemberDate(selected.lastSignInAt)}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 text-white/50 mb-1">
                        <Unlock className="h-3.5 w-3.5" />
                        <p className="text-xs uppercase tracking-wider">Unlock intents</p>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {formatMemberCount(selected.unlockIntents)}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 text-white/50 mb-1">
                        <Eye className="h-3.5 w-3.5" />
                        <p className="text-xs uppercase tracking-wider">Tracked page views</p>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {formatMemberCount(selected.pageViews)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                        Profile updated
                      </p>
                      <p className="text-sm text-white/70">
                        {formatMemberDate(selected.updatedAt)}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-xs text-white/50 uppercase tracking-wider mb-2">
                        Member ID
                      </p>
                      <p className="text-xs text-white/60 font-mono break-all">{selected.id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
