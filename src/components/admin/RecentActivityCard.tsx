import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Heart, BookOpen, User } from "lucide-react";

interface Activity {
  id: string;
  type: "message" | "mood" | "journal" | "signup";
  description: string;
  timestamp: string;
}

interface RecentActivityCardProps {
  activities: Activity[];
}

const activityIcons = {
  message: MessageSquare,
  mood: Heart,
  journal: BookOpen,
  signup: User,
};

const activityColors = {
  message: "text-blue-500",
  mood: "text-pink-500",
  journal: "text-amber-500",
  signup: "text-green-500",
};

export const RecentActivityCard = ({ activities }: RecentActivityCardProps) => {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-soft">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];
            
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-muted ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
