import { Skeleton } from "@/components/ui/skeleton";

export function PostTableSkeleton() {
  return (
    <div className="rounded-[10px] border border-dashed border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-28" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex items-start gap-4 rounded-lg border border-stroke/60 p-4 dark:border-dark-3"
          >
            <Skeleton className="h-16 w-24 rounded-md" />
            <div className="flex w-full flex-col gap-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
