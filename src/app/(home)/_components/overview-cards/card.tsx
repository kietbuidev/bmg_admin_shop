import { ArrowDownIcon, ArrowUpIcon } from "@/assets/icons";
import { cn } from "@/lib/utils";
import type { JSX, SVGProps } from "react";

type PropsType = {
  label: string;
  data: {
    value: number | string;
    growthRate: number;
    trendLabel?: string;
  };
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
  details?: Array<{ label: string; value: number }>;
};

export function OverviewCard({ label, data, Icon, details }: PropsType) {
  const isDecreasing = data.growthRate < 0;

  const trendLabel = data.trendLabel ?? label;
  const hasDetails = Boolean(details?.length);

  return (
    <div className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark">
      <Icon />

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <dl>
            <dt className="mb-1.5 text-heading-6 font-bold text-dark dark:text-white">
              {data.value}
            </dt>

            <dd className="text-sm font-medium text-dark-6">{label}</dd>
          </dl>

          {hasDetails ? (
            <ul className="mt-4 space-y-1 text-xs font-semibold text-dark-6 dark:text-dark-6">
              {details!.map(({ label: detailLabel, value }) => (
                <li key={detailLabel} className="flex items-center justify-between gap-3">
                  <span>{detailLabel}</span>
                  <span className="text-dark dark:text-white">{value}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <dl
          className={cn(
            "text-sm font-medium",
            isDecreasing ? "text-red" : "text-green",
          )}
        >
          <dt className="flex items-center gap-1.5">
            {data.growthRate}%
            {isDecreasing ? (
              <ArrowDownIcon aria-hidden />
            ) : (
              <ArrowUpIcon aria-hidden />
            )}
          </dt>

          <dd className="sr-only">
            {trendLabel} {isDecreasing ? "Decreased" : "Increased"} by{" "}
            {data.growthRate}%
          </dd>
        </dl>
      </div>
    </div>
  );
}
