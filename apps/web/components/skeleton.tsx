export function FeedSkeleton() {
  return (
    <div className="animate-pulse border-b border-neutral-200 p-4">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full bg-neutral-200" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-1/3 rounded bg-neutral-200" />
          <div className="h-4 w-5/6 rounded bg-neutral-200" />
          <div className="h-48 rounded-md bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}
