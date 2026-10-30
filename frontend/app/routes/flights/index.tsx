import type { Route } from "./+types/index";
import Logo from "../../logo";
import { Flight } from "./Flight"
import { useEffect, useState } from "react";
import "./index.css"
import { FileUpload } from "./FileUpload";
export default function Index() {
  const [flightList, setFlightList] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  useEffect(() => {
    async function fetchFlights() {
      try {
        const request = fetch("/api/flightList", {
          method: "GET"
        })
        let response = await request;
        setFlightList(await response.json()); 
        
      } catch (error) {
        alert("Konnte Flugliste nicht laden.")
        console.log(error);
      } finally {
        setLoading(false)
      }
      }
      fetchFlights()
  }, [])
  var flightItems;
  function backendDateToJS(b: String) {
    var firstPart = b.slice(0, 10);
    var secondPart = b.slice(11);
    return new Date(firstPart + "T" + secondPart + "Z");
  }
  if (flightList) {
    flightItems = flightList.map(flight => 
      <Flight key={(flight.id)}
      fileName={(flight.csv.split("/")[2].slice(0, -5))}
      startDate={backendDateToJS(flight.startDate)} 
      endDate={backendDateToJS(flight.endDate)} 
      id={flight.id} 
      airplane={flight.airplane}/>)
  }


  return (
    <div className="rootContainer">
      <div className="flightList">
        <FileUpload/>
        {flightItems}
      </div>
    </div>
  )
}