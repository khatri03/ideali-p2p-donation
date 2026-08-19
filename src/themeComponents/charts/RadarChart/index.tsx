import Chart from 'react-apexcharts';

const RadarChart = (props: any) => {
  const { chartData, chartOptions } = props;

  return (
    // @ts-ignore
    <Chart
      options={chartOptions}
      type="radar"
      width="100%"
      height="100%"
      series={chartData}
    />
  );
};

export default RadarChart;
