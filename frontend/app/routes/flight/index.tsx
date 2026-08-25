import { useParams } from "react-router";
export async function clientLoader({params}: Route.LoaderArgs) {
  const request = fetch("/api/flight?id=" + params.flightId, {
    method: "GET",
  })
  let response = await request;
  var flightData = await response.json();
  console.log(flightData);
  return flightData
}

export function HydrateFallback() {
  return <h1>Loading...</h1>
}

export default function Index({loaderData}: Route.ComponentProps) {
  let params = useParams();
  const {id, airplane} = loaderData
  return(
    <>
      <h1>{id}</h1>
      <h1>{airplane}</h1>
    </>
  )
}

