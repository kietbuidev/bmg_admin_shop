"use client";

import { useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

type PropsType = {
  data: Array<{
    date: string;
    total: number;
  }>;
};

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export function PaymentsOverviewChart({ data }: PropsType) {
  const isMobile = useIsMobile();

  const coercedSeries = useMemo(() => {
    return data.map((item, index) => {
      const timestamp = Date.parse(item.date);
      return {
        x: Number.isNaN(timestamp) ? index : timestamp,
        y: item.total ?? 0,
      };
    });
  }, [data]);

  const rollingAverage = useMemo(() => {
    const windowSize = 7;
    return coercedSeries.map((point, idx, array) => {
      const start = Math.max(0, idx - (windowSize - 1));
      const slice = array.slice(start, idx + 1);
      const sum = slice.reduce((acc, curr) => acc + curr.y, 0);
      const avg = slice.length ? sum / slice.length : 0;
      return {
        x: point.x,
        y: Number.isFinite(avg) ? Number(avg.toFixed(2)) : 0,
      };
    });
  }, [coercedSeries]);

  const highestPoint = useMemo(() => {
    return coercedSeries.reduce<{ x: number; y: number } | null>((acc, point) => {
      if (typeof point.x !== "number") return acc;
      if (!acc || point.y > acc.y) {
        return { x: point.x, y: point.y };
      }
      return acc;
    }, null);
  }, [coercedSeries]);

  const options = useMemo<ApexOptions>(() => {
    return {
      chart: {
        type: "line",
        height: 320,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: "inherit",
      },
      plotOptions: {
        bar: {
          columnWidth: "58%",
          borderRadius: 6,
        },
      },
      stroke: {
        width: [0, isMobile ? 3 : 4],
        curve: "smooth",
        lineCap: "round",
      },
      colors: ["#38BDF8", "#6366F1"],
      fill: {
        opacity: [0.85, 1],
        type: ["gradient", "solid"],
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.35,
          opacityFrom: 0.9,
          opacityTo: 0.3,
          stops: [0, 80, 100],
        },
      },
      markers: {
        size: [0, isMobile ? 4 : 6],
        strokeWidth: 3,
        strokeColors: "#EEF2FF",
        hover: { sizeOffset: 2 },
      },
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "left",
        fontSize: "13px",
      },
      grid: {
        borderColor: "rgba(148, 163, 184, 0.25)",
        strokeDashArray: 5,
        yaxis: { lines: { show: true } },
      },
      dataLabels: { enabled: false },
      tooltip: {
        shared: true,
        intersect: false,
        x: { format: "dd MMM yyyy" },
        y: {
          formatter(value, opts) {
            const isAverage = opts?.seriesIndex === 1;
            return isAverage
              ? `${value.toFixed(1)} avg`
              : `${Math.round(value)} visits`;
          },
        },
      },
      xaxis: {
        type: "datetime",
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          datetimeUTC: false,
          style: {
            colors: "rgba(100, 116, 139, 0.9)",
          },
          formatter: (value) => {
            const timestamp = Number(value);
            if (Number.isNaN(timestamp)) {
              return "";
            }
            return new Date(timestamp).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
          },
        },
      },
      yaxis: {
        labels: {
          formatter: (value) => `${Math.round(value)}`,
          style: {
            colors: "rgba(100, 116, 139, 0.9)",
          },
        },
      },
      annotations: {
        points:
          highestPoint && typeof highestPoint.x === "number"
            ? [
                {
                  x: highestPoint.x,
                  y: highestPoint.y,
                  marker: { size: 0 },
                  label: {
                    text: `Peak ${highestPoint.y}`,
                    offsetY: -10,
                    style: {
                      background: "#0EA5E9",
                      color: "#ffffff",
                      fontSize: "12px",
                    },
                  },
                },
              ]
            : [],
      },
      noData: {
        text: "No visitor data",
        align: "center",
        verticalAlign: "middle",
        style: {
          color: "#94A3B8",
          fontSize: "14px",
        },
      },
    } satisfies ApexOptions;
  }, [highestPoint, isMobile]);

  return (
    <div className="-ml-4 -mr-5 h-[320px]">
      <Chart
        options={options}
        series={[
          {
            name: "Daily visits",
            type: "column",
            data: coercedSeries,
          },
          {
            name: "7-day average",
            type: "line",
            data: rollingAverage,
          },
        ]}
        type="line"
        height={320}
      />
    </div>
  );
}
