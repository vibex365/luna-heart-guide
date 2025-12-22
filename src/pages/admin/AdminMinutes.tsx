import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminMinutesManager } from "@/components/admin/AdminMinutesManager";
import { Clock } from "lucide-react";

const AdminMinutes = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-500" />
            Voice Minutes Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Track purchases, monitor usage, and manage user minute balances
          </p>
        </div>

        <AdminMinutesManager />
      </div>
    </AdminLayout>
  );
};

export default AdminMinutes;