import { AdminLayout } from "@/components/admin/AdminLayout";
import { GameVisibilityCMS } from "@/components/admin/cms/GameVisibilityCMS";
import { Gamepad2 } from "lucide-react";

const AdminGames = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-purple-500" />
            Game Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Control which games are visible to users
          </p>
        </div>

        <GameVisibilityCMS />
      </div>
    </AdminLayout>
  );
};

export default AdminGames;
