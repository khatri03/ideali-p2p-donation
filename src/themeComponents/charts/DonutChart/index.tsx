import Chart from 'react-apexcharts';

const DonutChart = (props: any) => {
  const { chartData } = props;

  return (
    // @ts-ignore
    <Chart
      options={props.chartOptions}
      type="donut"
      width="100%"
      height="100%"
      series={chartData}
    />
  );
};

export default DonutChart;
