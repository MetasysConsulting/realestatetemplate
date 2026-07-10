import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { formatCount } from "@/lib/admin/listing-analytics";
import {
  formatActivityTime,
  formatEventLabel,
  type SiteActivitySummary,
} from "@/lib/admin/site-activity-analytics";
import { Activity, Eye, Unlock, UserPlus, Users } from "lucide-react";

type AdminHomeProps = {
  activity: SiteActivitySummary;
};

export default function AdminHome({ activity }: AdminHomeProps) {
  const hasEvents =
    activity.available &&
    (activity.pageViews7d > 0 ||
      activity.loginEvents7d > 0 ||
      activity.signupEvents7d > 0 ||
      activity.unlockIntents7d > 0 ||
      activity.recentEvents.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Activity</h1>
        <p className="text-sm sm:text-base text-white/50 mt-1">
          Site visits, top pages, and key member actions
        </p>
      </div>

      {!activity.available ? (
        <Card>
          <CardContent className="pt-6">
            <AdminEmptyState
              title="Activity unavailable"
              description="Could not reach site analytics storage. Check database connection on this deployment."
            />
          </CardContent>
        </Card>
      ) : !hasEvents ? (
        <Card>
          <CardContent className="pt-6">
            <AdminEmptyState
              title="No activity yet"
              description="Page views and member actions will appear here as visitors use the public site."
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
                  <p className="text-xs uppercase tracking-wider">Visitors today</p>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatCount(activity.visitorsToday)}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  {formatCount(activity.visitors7d)} in last 7 days
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-white/50 mb-2">
                  <Eye className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-wider">Page views today</p>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatCount(activity.pageViewsToday)}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  {formatCount(activity.pageViews7d)} in last 7 days
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-white/50 mb-2">
                  <UserPlus className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-wider">Auth (7 days)</p>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatCount(activity.loginEvents7d + activity.signupEvents7d)}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  {formatCount(activity.loginEvents7d)} logins ·{" "}
                  {formatCount(activity.signupEvents7d)} signups
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-white/50 mb-2">
                  <Unlock className="h-4 w-4" />
                  <p className="text-xs uppercase tracking-wider">Unlocks (7 days)</p>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatCount(activity.unlockIntents7d)}
                </p>
                <p className="text-xs text-white/40 mt-1">Listing unlock intents</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-white text-base sm:text-lg">Top pages</CardTitle>
                <p className="text-sm text-white/50">Most viewed paths in the last 7 days</p>
              </CardHeader>
              <CardContent>
                {activity.topPages.length === 0 ? (
                  <AdminEmptyState
                    compact
                    title="No page views yet"
                    description="Top pages will appear once visitors browse the site."
                  />
                ) : (
                  <div className="space-y-3">
                    {activity.topPages.map((page) => {
                      const max = activity.topPages[0]?.views || 1;
                      const pct = Math.round((page.views / max) * 100);
                      return (
                        <div key={page.path} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <p className="text-white truncate font-mono text-xs sm:text-sm">
                              {page.path}
                            </p>
                            <p className="text-white/80 font-medium shrink-0">
                              {formatCount(page.views)}
                            </p>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full"
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-white text-base sm:text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent activity
                </CardTitle>
                <p className="text-sm text-white/50">Latest tracked events</p>
              </CardHeader>
              <CardContent>
                {activity.recentEvents.length === 0 ? (
                  <AdminEmptyState
                    compact
                    title="No recent events"
                    description="New visits and actions will show up here in real time."
                  />
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {activity.recentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start justify-between gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">
                            {formatEventLabel(event.eventName)}
                          </p>
                          <p className="text-xs text-white/45 font-mono truncate mt-0.5">
                            {event.path}
                          </p>
                        </div>
                        <p className="text-xs text-white/40 shrink-0">
                          {formatActivityTime(event.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
