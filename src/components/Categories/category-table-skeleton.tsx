import { Skeleton } from "@/components/ui/skeleton";

export function CategoryTableSkeleton() {
  return (
    <div className="rounded-[10px] border border-dashed border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 rounded-lg border border-stroke/60 p-4 dark:border-dark-3"
          >
            <Skeleton className="size-12 rounded-full" />
            <div className="flex w-full flex-col gap-3">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-4 w-4/5" />
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
