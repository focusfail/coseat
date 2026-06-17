import type { Route } from "./+types/index";
import Logo from "../../logo";
import { Flight } from "./Flight"
import "./index.css"
import { FileUpload } from "./FileUpload";
export default function Index() {
  var flightDate1 = new Date(2026, 10, 22, 13, 0)
  var flightDate2 = new Date(2026, 5, 19, 17, 54)

  return (
    <div className="rootContainer">
      <div className="flightList">
        <FileUpload/>
        <Flight departureAirport="Frankfurt Airport" arrivalAirport="John F. Kennedy Airport" date={flightDate1} endDate={new Date(2026, 10, 22, 14, 22)} />
        <Flight departureAirport="Egelsbach Airport" arrivalAirport="Frankfurt Airport" date={flightDate2} endDate={new Date(2026, 5, 19, 19, 0)} />
        <Flight departureAirport="Frankfurt Airport" arrivalAirport="John F. Kennedy Airport" date={new Date(2026, 10, 22, 8, 45)} endDate={new Date(2026, 10, 22, 14, 22)} />
        <Flight departureAirport="Egelsbach Airport" arrivalAirport="Frankfurt Airport" date={new Date(2026, 5, 19, 16, 30)} endDate={new Date(2026, 5, 19, 19, 0)} />
        <Flight departureAirport="Munich Airport" arrivalAirport="Heathrow Airport" date={new Date(2026, 0, 14, 6, 20)} endDate={new Date(2026, 0, 14, 8, 5)} />
        <Flight departureAirport="Berlin Brandenburg Airport" arrivalAirport="Charles de Gaulle Airport" date={new Date(2026, 2, 3, 11, 0)} endDate={new Date(2026, 2, 3, 13, 15)} />
        <Flight departureAirport="Hamburg Airport" arrivalAirport="Barcelona El Prat Airport" date={new Date(2026, 3, 17, 7, 55)} endDate={new Date(2026, 3, 17, 11, 30)} />
        <Flight departureAirport="Düsseldorf Airport" arrivalAirport="Fiumicino Airport" date={new Date(2026, 4, 9, 9, 10)} endDate={new Date(2026, 4, 9, 11, 45)} />
        <Flight departureAirport="Stuttgart Airport" arrivalAirport="Schiphol Airport" date={new Date(2026, 6, 28, 14, 35)} endDate={new Date(2026, 6, 28, 16, 20)} />
        <Flight departureAirport="Vienna International Airport" arrivalAirport="JFK Airport" date={new Date(2026, 7, 5, 10, 0)} endDate={new Date(2026, 7, 5, 18, 55)} />
        <Flight departureAirport="Zurich Airport" arrivalAirport="Dubai International Airport" date={new Date(2026, 8, 12, 23, 30)} endDate={new Date(2026, 8, 13, 7, 45)} />
        <Flight departureAirport="Frankfurt Airport" arrivalAirport="Tokyo Haneda Airport" date={new Date(2026, 9, 1, 13, 20)} endDate={new Date(2026, 9, 2, 8, 10)} />
        <Flight departureAirport="Copenhagen Airport" arrivalAirport="Frankfurt Airport" date={new Date(2026, 11, 24, 8, 0)} endDate={new Date(2026, 11, 24, 10, 30)} />
        <Flight departureAirport="Madrid Barajas Airport" arrivalAirport="Munich Airport" date={new Date(2026, 1, 18, 15, 45)} endDate={new Date(2026, 1, 18, 19, 10)} />
      </div>
    </div>
  )
}