import type { Route } from "./+types/index";

export async function loader({ params }: Route.LoaderArgs) {
  //                           ^? { teamId: string }
}
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Chart.js Line Chart',
    },
  },
};

const labels = ['16:32', '33', '34', '35', '36' ];

export const data = {
  labels,
  datasets: [
    {
      label: 'E1 Temp',
      data: [5, 3, 5, 5, 2, 1, 9, 3, 4, 69, 69],
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
    },
    {
      label: 'E2 Temp',
      data: [2, 1, 9, 8, 4, 2, 4, 17, 32, 53, 32],
      borderColor: 'rgb(53, 162, 235)',
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
    },
  ],
};

export default function Component({
  params,
}: Route.ComponentProps) {
  return(
    <>
      <a>{params.flightId}</a>
      <div style={{"marginTop": "5vh", "height": "200px", "width": "23vw"}}>
        <Line datasetIdKey="id" data={data} options={{"responsive": true}}/>
      </div>
    </>

  )
  //        ^ string
}
