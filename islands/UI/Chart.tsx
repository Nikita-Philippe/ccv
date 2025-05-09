import { cn } from "@utils/cn.ts";
import { useEffect, useRef, useState } from "preact/hooks";
import ApexCharts from "apexcharts";

type ChartProps = {
  options: ApexCharts.ApexOptions;
  sx?: string;
  // Use the correct typing for the function
  getChart?: (chart: ApexCharts) => void;
};

export default function Chart({ sx, options, getChart }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<ApexCharts | undefined>();

  useEffect(() => {
    if (!chartRef.current) return;

    const newChart = new ApexCharts(chartRef.current, options);
    newChart.render();
    setChart(newChart);

    // Return the chart instance to parent if needed
    if (getChart) getChart(newChart);

    return () => {
      newChart.destroy();
    };
  }, []);

  // TODO on options update (only datas/style/etc.)
  useEffect(() => {
    if (chart) chart.updateOptions(options);
  }, [options]);

  return <div ref={chartRef} className={cn(sx)} />;
}
