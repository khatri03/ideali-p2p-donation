import Chart from 'react-apexcharts';

const BarChart = (props: any) => {
  const { chartData, chartOptions } = props;

  return (
    // @ts-ignore
    <Chart
      options={chartOptions}
      type="pie"
      width="100%"
      height="55%"
      series={chartData}
    />
  );
};

export default BarChart;
