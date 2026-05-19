import "./Flight.css"
export function Flight({ name, location, airplane }) {
    return (
        <div className="flightContainer">
            <span className="flightName">{name}</span>
        </div>
    )
}