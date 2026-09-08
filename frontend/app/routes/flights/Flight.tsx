import "./Flight.css"
import Takeoff from "./Takeoff"
import { timeDuration } from "../../utils/timeDuration"
import Arrow from "./arrow"
export function Flight({startDate, endDate, airplane, fileName, id}: {startDate: Date, endDate: Date, airplane: String, fileName: String, id: String}) {
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
    return (
        <div className="flightContainer" onClick={() => {window.location.href = "../flight/" + id}}>
            <span className="flexRow">
                <span className="flightDuration">{timeDuration(startDate, endDate)}</span>
                <span>•</span>
                <span className="flightAirplane">{airplane}</span>
            </span>
            <span className="flightTitle"><Takeoff className="icon"/>{toTimeStr(startDate)}</span>
            <span className="flightFile">{fileName}</span>
        </div>
    )
}
