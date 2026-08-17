import "./Flight.css"
import Takeoff from "./Takeoff"
import Arrow from "./arrow"
export function Flight({startDate, endDate, airplane, id}: {startDate: Date, endDate: Date, airplane: String, id: String}) {
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
        var timeDiff = Math.abs(startDate.getTime() - endDate.getTime())
        console.log(timeDiff)
        var seconds = Math.floor((timeDiff / 1000));
        var minutes = Math.floor(seconds / 60) % 60;
        var hours = Math.floor(seconds / 3600);
        if (hours == 0 && minutes == 0) {
            return seconds + " Sek."
        }
        if (hours == 0) {
            return minutes + " Min."
        }
        return hours + " Std. " + minutes + " min.";
    }
    return (
        <div className="flightContainer">
            <span className="flexRow">
                <span className="flightDuration">{timeDuration(startDate, endDate)}</span>
                <span>•</span>
                <span className="flightAirplane">{airplane}</span>
            </span>
            <span className="flightTitle"><Takeoff className="icon"/>{toTimeStr(startDate)}</span>
        </div>
    )
}
