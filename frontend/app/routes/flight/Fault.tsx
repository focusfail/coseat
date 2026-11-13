import './Fault.css'
import { LABEL, ORDER, WarningSymbol, type AnomalyEvent } from './WarningLights'

export function Fault({ start, end, score, events }: { start: string; end: string; score: number; events: AnomalyEvent[] }) {
    const from = start.split(" ").pop()
    const to = end.split(" ").pop()
    const lamps = ORDER
        .map((kind) => {
            const list = events.filter((e) => e.kind === kind)
            if (!list.length) return null
            const red = list.some((e) => e.severity === "red")
            return { kind, label: `${LABEL[kind]} – ${red ? "Warnung" : "Vorsicht"}` }
        })
        .filter((l) => l !== null)
    return (
        <div className="faultPill">
            <span className="faultTime">{from === to ? from : `${from}–${to}`}</span>
            <span className="faultScore" title="Höchster Anomaliescore">max. {score.toFixed(2)}</span>
            {lamps.length > 0 && (
                <span className="faultLamps">
                    {lamps.map(({ kind, label }) => (
                        <span key={kind} className="faultLamp" role="img" aria-label={label} title={label}>
                            <WarningSymbol kind={kind} />
                        </span>
                    ))}
                </span>
            )}
        </div>
    )
}
