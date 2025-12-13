import { Skeleton } from "@/components/ui/skeleton";

export const ChatSkeleton = () => {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header skeleton */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </header>

      {/* Messages skeleton */}
      <div className="flex-1 overflow-hidden px-4 py-4 space-y-4">
        {/* Assistant message */}
        <div className="flex gap-3 max-w-[85%]">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>

        {/* User message */}
        <div className="flex justify-end">
          <Skeleton className="h-12 w-48 rounded-2xl" />
        </div>

        {/* Assistant message */}
        <div className="flex gap-3 max-w-[85%]">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        {/* User message */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-36 rounded-2xl" />
        </div>
      </div>

      {/* Input skeleton */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-12 rounded-xl" />
          <Skeleton className="w-12 h-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const MoodSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="flex-1">
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="w-16 h-8 rounded-full" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Streak widget skeleton */}
        <Skeleton className="h-24 w-full rounded-2xl" />

        {/* Today's mood card skeleton */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <Skeleton className="h-5 w-20 mb-4" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>

        {/* Chart skeleton */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>

        {/* History skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export const JournalSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="flex-1">
            <Skeleton className="h-6 w-24 mb-1" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="w-28 h-10 rounded-xl" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-start justify-between mb-3">
              <div>
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export const BreatheSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="flex-1">
            <Skeleton className="h-6 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-4 w-64 mx-auto mb-6" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-2xl p-6 border border-border">
            <Skeleton className="h-5 w-36 mb-2" />
            <Skeleton className="h-4 w-64 mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="h-6 w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-8">
        <div className="max-w-md mx-auto space-y-6">
          {/* Profile card skeleton */}
          <div className="bg-card rounded-3xl p-8 border border-border">
            <Skeleton className="h-7 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto mb-8" />
            
            {/* Avatar skeleton */}
            <div className="flex justify-center mb-8">
              <Skeleton className="w-24 h-24 rounded-full" />
            </div>

            {/* Form fields skeleton */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          </div>

          {/* Preferences skeleton */}
          <div className="bg-card rounded-3xl p-8 border border-border">
            <Skeleton className="h-6 w-40 mx-auto mb-2" />
            <Skeleton className="h-4 w-56 mx-auto mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </div>

          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </main>
    </div>
  );
};
