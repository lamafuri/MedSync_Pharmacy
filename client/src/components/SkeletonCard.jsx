function SkeletonCard() {
  return (
    <div className="bg-card rounded-card border border-border shadow-card p-6 animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-11 h-11 bg-faint rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-faint rounded w-3/4" />
          <div className="h-3 bg-faint rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-faint rounded w-full" />
        <div className="h-3 bg-faint rounded w-2/3" />
      </div>
    </div>
  );
}

export default SkeletonCard;
