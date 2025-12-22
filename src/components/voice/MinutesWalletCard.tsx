import { Clock, Plus, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMinutesWallet } from "@/hooks/useMinutesWallet";

interface MinutesWalletCardProps {
  onPurchase?: () => void;
  compact?: boolean;
}

export const MinutesWalletCard = ({ onPurchase, compact = false }: MinutesWalletCardProps) => {
  const { balance, lifetimePurchased, lifetimeUsed, isLoading } = useMinutesWallet();

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
        <Clock className="w-4 h-4 text-primary" />
        <span className="font-semibold text-primary">{balance}</span>
        <span className="text-sm text-muted-foreground">min</span>
        {onPurchase && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 w-6 p-0 ml-1"
            onClick={onPurchase}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5 text-primary" />
          Luna Voice Minutes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-primary">{balance}</span>
          <span className="text-lg text-muted-foreground">minutes available</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">
              {lifetimePurchased} purchased
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-muted-foreground">
              {lifetimeUsed} used
            </span>
          </div>
        </div>

        {onPurchase && (
          <Button 
            onClick={onPurchase} 
            className="w-full"
            variant={balance < 5 ? "default" : "outline"}
          >
            <Plus className="w-4 h-4 mr-2" />
            {balance < 5 ? "Add Minutes" : "Buy More Minutes"}
          </Button>
        )}

        {balance === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Add minutes to start talking with Luna
          </p>
        )}
      </CardContent>
    </Card>
  );
};
