import './Fault.css'
export function Fault({time, value}: {time: String, value: String}) {
    return (
        <div className="faultContainer">
            <span className="faultTime">{time}</span>
            <span className="faultValue">{value}</span>
        </div>
    )
}
