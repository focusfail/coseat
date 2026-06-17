import "./Flight.css"
import Takeoff from "./Takeoff"
import Arrow from "./arrow"
export function Flight({departureAirport, arrivalAirport, date, endDate}: {departureAirport: String, arrivalAirport: String, date: Date, endDate: Date}) {
    function toTimeStr(date: Date) {
        var flightDate = date
        const options = {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        } as const;
        var result = flightDate.toLocaleString("de-DE", options);
        return result
    }
    function timeDuration(startDate: Date, endDate: Date) {
        var timeDiff = startDate.getTime() / 1000 - endDate.getTime() / 1000;
        var newDate = new Date(null);
        newDate.setSeconds(timeDiff);
        var result = newDate.toISOString().slice(12, 19);
        return result.slice(0, 4) + " Std.";
    }
    return (
        <div className="flightContainer">
            <span className="flexRow">
                <span className="flightDuration">{timeDuration(date, endDate)}</span>
                <span>•</span>
                <span className="flightAirplane">Diamond DA42NG</span>
            </span>
            <span className="flightTitle"><Takeoff className="icon"/>{toTimeStr(date)}</span>
        </div>
    )
}
