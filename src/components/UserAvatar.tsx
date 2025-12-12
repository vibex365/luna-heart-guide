import { User } from "lucide-react";

interface UserAvatarProps {
  avatarUrl: string | null;
  displayName: string | null;
  email?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
};

const UserAvatar = ({
  avatarUrl,
  displayName,
  email,
  size = "md",
  className = "",
}: UserAvatarProps) => {
  const initial = displayName?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || "?";

  return (
    <div
      className={`rounded-full overflow-hidden bg-secondary flex items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName || "User avatar"}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-medium text-foreground">{initial}</span>
      )}
    </div>
  );
};

export default UserAvatar;
