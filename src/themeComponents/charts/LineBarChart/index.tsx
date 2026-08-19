import Chart from 'react-apexcharts';

const BarChart = (props: any) => {
  const { chartData } = props;

  return (
    // @ts-ignore
    <Chart
      options={props.chartOptions}
      type="line"
      width="100%"
      height="100%"
      series={chartData}
    />
  );
};

export default BarChart;
