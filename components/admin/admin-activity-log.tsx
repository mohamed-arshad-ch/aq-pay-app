"use client";
import { Clock, User, CreditCard, Settings, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/store/hooks";
import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { fetchActivities } from "@/store/slices/activitiesSlice";

export function AdminActivityLog({
  isLoading = false,
}: {
  isLoading?: boolean;
}) {
  const dispatch = useAppDispatch();
  const activities = useAppSelector((state) => state.activities?.data);

  useEffect(() => {
    dispatch(fetchActivities());
  }, [dispatch]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>
          Recent administrative activities in the system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">
              No recent activities available
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  {activity.icon === "User" ? (
                    <User className="h-5 w-5 text-primary" />
                  ) : activity.icon === "CreditCard" ? (
                    <CreditCard className="h-5 w-5 text-primary" />
                  ) : activity.icon === "Settings" ? (
                    <Settings className="h-5 w-5 text-primary" />
                  ) : (
                    <Shield className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.user}{" "}
                    <span className="text-muted-foreground">
                      {activity.action}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.resource}
                  </p>
                  <div className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(activity.timestamp).toLocaleTimeString()} on{" "}
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
