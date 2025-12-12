import { Shield } from "lucide-react";

const AdminPlaceholder = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <Shield className="h-16 w-16 text-primary" />
      <h1 className="text-3xl font-semibold text-foreground">Admin Panel</h1>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  );
};

export default AdminPlaceholder;
