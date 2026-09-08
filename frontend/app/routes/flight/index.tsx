import { useParams } from "react-router";
import './index.css'
import {Line, LineChart, Tooltip, YAxis} from 'recharts';
import { timeDuration } from "../../utils/timeDuration";
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
  return <h1>Lädt...</h1>
}

export default function Index({loaderData}: Route.ComponentProps) {
  let params = useParams();
  const {id, airplane, startDate, endDate, fileName, json} = loaderData
  var {error, friendlyMessage, message} = loaderData
  if (!error) {
    try {
      var flightData = JSON.parse(json);
    } catch {
      message = "json.parse() failed"
      friendlyMessage = "Fehler beim Einlesen des Fluglogs. Vielleicht kann das Problem durch ein neues Hochladen gelöst werden."
      error = true;
    }
  }
  if (error) {
    return(
      <>
        <h1>Es ist ein Fehler aufgetreten.</h1>
        <h3>{friendlyMessage}</h3>
        <h4 style={{fontFamily: "monospace", color: "#b50303"}}>{message}. Flight Number {id}.</h4>
      </>
    )
  }
  const chartData = flightData.timestamps.map((timestamp, index) => ({
    timestamp,
    power: flightData.engine_0.power[index],
    oil_temp: flightData.engine_0.oil_temperature[index],
    fuel_flow: flightData.engine_0.fuel_flow[index],
    fuel_pressure: flightData.engine_0.fuel_pressure[index],
    rpm: flightData.engine_0.rpm[index],
    oil_pressure: flightData.engine_0.oil_pressure[index]
  }));
  return(
    <>
      {fileName}
      <div className={"flightTitleDiv"}>
        <div className="propertyDiv">
          <span className="propertyTitle">
            DAUER
          </span>
          <span className="property">
            
            {timeDuration(new Date(startDate), new Date(endDate))}
          </span>
        </div>
        <div className="propertyDiv">
          <span className="propertyTitle">
            FLUGZEUG
          </span>
          <span className="property">
            {airplane}
          </span>
        </div>
        <div className="propertyDiv">
          <span className="propertyTitle">
            START
          </span>
          <span className="property">
            {startDate}
          </span>
        </div>
        <div className="propertyDiv">
          <span className="propertyTitle">
            ENDE
          </span>
          <span className="property">
            {endDate}
          </span>
        </div>
      </div>
    </>
  )
}

