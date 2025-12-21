import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminCoinManager } from "@/components/admin/AdminCoinManager";
import { Coins } from "lucide-react";

const AdminCoins = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Coins className="h-6 w-6 text-yellow-500" />
            Coin Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View balances, track transactions, and give coins to users
          </p>
        </div>

        <AdminCoinManager />
      </div>
    </AdminLayout>
  );
};

export default AdminCoins;