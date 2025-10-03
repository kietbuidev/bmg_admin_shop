import { PeriodPicker } from "@/components/period-picker";
import { standardFormat } from "@/lib/format-number";
import { cn } from "@/lib/utils";
import { getPaymentsOverviewData } from "@/services/charts.services";
import { PaymentsOverviewChart } from "./chart";

type PropsType = {
  timeFrame?: string;
  className?: string;
};

export async function PaymentsOverview({
  timeFrame = "monthly",
  className,
}: PropsType) {
  const data = await getPaymentsOverviewData(timeFrame);
  const totalVisits = data.summary.totalVisits;
  const uniqueIps = data.summary.uniqueIps;
  const { startDate, endDate } = data.filters;
  const dayCount = data.dailyVisits.length || 1;
  const averageVisits = Math.round(totalVisits / dayCount) || 0;
  const peakDay = data.dailyVisits.reduce<
    { date: string; total: number } | null
  >((acc, current) => {
    if (!acc || current.total > acc.total) {
      return current;
    }
    return acc;
  }, null);

  const formattedRange = (() => {
    const formatter = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (startDate && endDate) {
      return `${formatter.format(new Date(startDate))} – ${formatter.format(new Date(endDate))}`;
    }

    if (startDate) {
      return `Since ${formatter.format(new Date(startDate))}`;
    }

    if (endDate) {
      return `Up to ${formatter.format(new Date(endDate))}`;
    }

    return "All recorded traffic";
  })();

  return (
    <div
      className={cn(
        "grid gap-2 rounded-[10px] bg-white px-7.5 pb-6 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
          Visitors Overview
        </h2>

        <PeriodPicker defaultValue={timeFrame} sectionKey="payments_overview" />
      </div>

      <p className="text-sm text-dark-4 dark:text-dark-6">
        {formattedRange}
      </p>

      <PaymentsOverviewChart data={data.dailyVisits} />

      <dl className="grid divide-stroke text-center dark:divide-dark-3 sm:grid-cols-3 sm:divide-x [&>div]:flex [&>div]:flex-col-reverse [&>div]:gap-1">
        <div className="dark:border-dark-3 max-sm:mb-3 max-sm:border-b max-sm:pb-3">
          <dt className="text-xl font-bold text-dark dark:text-white">
            {standardFormat(totalVisits)}
          </dt>
          <dd className="font-medium dark:text-dark-6">Total Visits</dd>
        </div>

        <div className="dark:border-dark-3 max-sm:mb-3 max-sm:border-b max-sm:pb-3">
          <dt className="text-xl font-bold text-dark dark:text-white">
            {standardFormat(uniqueIps)}
          </dt>
          <dd className="font-medium dark:text-dark-6">Unique IPs</dd>
        </div>

        <div>
          <dt className="text-xl font-bold text-dark dark:text-white">
            {standardFormat(averageVisits)}
          </dt>
          <dd className="font-medium dark:text-dark-6">
            Avg Daily Visits
            {peakDay && (
              <span className="mt-0.5 block text-xs font-normal text-dark-4 dark:text-dark-6">
                Peak {new Date(peakDay.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
                : {" "}
                {standardFormat(peakDay.total)}
              </span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
