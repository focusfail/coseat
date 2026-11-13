import './WarningLights.css'

export type AnomalyEvent = {
  kind: "oil_pressure" | "oil_temperature" | "engine" | "sensor";
  severity: "yellow" | "red";
  start: string;
  end: string;
  seconds: number;
  value: number | null;
  max_score: number;
};

export const LABEL: Record<AnomalyEvent["kind"], string> = {
  oil_pressure: "Öldruck",
  oil_temperature: "Öltemperatur",
  engine: "Motor",
  sensor: "Sensor",
};

export const ORDER: AnomalyEvent["kind"][] = ["oil_pressure", "oil_temperature", "engine", "sensor"];

function worstValue(kind: AnomalyEvent["kind"], events: AnomalyEvent[]) {
  const vals = events.map((e) => e.value).filter((v): v is number => v !== null);
  if (!vals.length) return "";
  const de = (v: number, digits: number) => v.toLocaleString("de-DE", { maximumFractionDigits: digits, minimumFractionDigits: digits });
  switch (kind) {
    case "oil_pressure": return `, min. ${de(Math.min(...vals), 1)} bar`;
    case "oil_temperature": return `, max. ${de(Math.max(...vals), 0)} °C`;
    case "engine": return `, max. ${de(Math.max(...vals), 0)} U/min`;
    default: return "";
  }
}

export function WarningLights({ events }: { events: AnomalyEvent[] }) {
  if (!events.length) return null;
  const lights = ORDER
    .map((kind) => {
      const list = events.filter((e) => e.kind === kind);
      if (!list.length) return null;
      const severity = list.some((e) => e.severity === "red") ? "red" : "yellow";
      const seconds = list.reduce((s, e) => s + e.seconds, 0);
      const first = list[0].start.split(" ").pop();
      const text = `${LABEL[kind]} – ${severity === "red" ? "Warnung" : "Vorsicht"}: ${list.length}× (${seconds} s), ab ${first}${worstValue(kind, list)}`;
      return { kind, severity, text };
    })
    .filter((l) => l !== null)
    .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "red" ? -1 : 1));

  return (
    <div className="warningLights">
      {lights.map(({ kind, severity, text }) => (
        <span key={kind} className={`warningLight ${severity}`} role="img" aria-label={text} title={text}>
          <WarningSymbol kind={kind} />
        </span>
      ))}
    </div>
  );
}

export function WarningSymbol({ kind }: { kind: AnomalyEvent["kind"] }) {
  switch (kind) {
    case "engine":
      return (
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <path fill="none" stroke="currentColor" strokeWidth="11" d="m30.34 87.191c0-3.866 3.134-7 7-7h6.0762c3.866 0 7-3.134 7-7v-3.161c0-3.866 3.134-7 7-7h57.01c3.866 0 7 3.134 7 7v3.161c0 3.866 3.134 7 7 7h20.462c3.866 0 7 3.134 7 7v3.8963c0 3.866 3.134 7 7 7h0.77725c3.866 0 7-3.134 7-7v-11.819c0-3.01 2.44-5.45 5.45-5.45 2.2464 0.06763 4.1987 1.562 4.8507 3.7127l5.1398 15.283c1.1747 3.4928 1.7737 7.1533 1.7737 10.838v19.298c0 3.685-0.59905 7.3455-1.7737 10.838l-5.1398 15.283c-0.65198 2.1507-2.6044 3.6451-4.8507 3.7127-3.01 0-5.45-2.44-5.45-5.45v-11.819c0-3.866-3.134-7-7-7h-0.77725c-3.866 0-7 3.134-7 7v18.509c0 3.866-3.134 7-7 7h-69.469c-1.8565 0-3.637-0.7375-4.9497-2.0502l-18.226-18.226c-1.3128-1.3128-3.0932-2.0502-4.9497-2.0502h-14.041c-3.866 0-7-3.134-7-7 0.04704-14.835 0.06388-29.67 0.08693-44.505z" />
          <path fill="currentColor" d="m55.339 43.033v8h18.746v11.996h26.5v-11.996h18.744v-8z" />
          <path fill="currentColor" d="m30.315 103.47h-13.926v29.254l-6-6v-26.12l-2.2695-2.2695v-23.849l8.2695-8.2695v29.254h13.938z" />
        </svg>
      );
    case "oil_pressure":
      return (
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <path fill="currentColor" d="m11.951 58.867-7.8086 29.146 37.898 14.066v31.008h87.648l41.787-50.451 8.5128-2.6846 4.5655 4.7681 5.6618-6.8803-8.6347-8.8313-19.051 8.0307-48.686 12.508-7.9551-7.957h-22.289v-10.064h11.26v-10h-32.52v10h11.26v10.064h-21.561v-7.8418zm6.8164 13.197 23.273 8.6367v10.713l-25.883-9.6074zm138.24 13.243-32.018 37.78h-72.947v-31.498h49.707l9.2441 9.2441z" />
          <path fill="currentColor" d="m187.69 101.34c0.25907 2.5987 0.33343 5.3253 1.6038 7.6787 1.0182 1.9309 1.5768 4.2267 1.06 6.3859-0.50729 1.6344-1.8645 2.9226-3.3876 3.6356-1.207 0.46222-2.5574 0.39771-3.8147 0.21508-1.6372-0.43101-3.0079-1.677-3.798-3.1513-0.77169-1.6722-0.4754-3.6262 0.0322-5.331 0.58637-1.5982 1.5551-3.0653 1.815-4.7768 0.50649-2.3923 0.35025-4.8876 1.005-7.2505 0.29081-0.984 1.0024-2.0868 2.159-2.0582 0.60118-0.0108 1.5162-0.0935 2.1286 0.67862 0.84419 0.86479 1.0108 2.4669 1.1966 3.9738z" />
        </svg>
      );
    case "oil_temperature":
      return (
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <g transform="translate(-2 62) scale(0.8)" stroke="currentColor" strokeWidth="4" strokeLinejoin="round">
            <path fill="currentColor" d="m11.951 58.867-7.8086 29.146 37.898 14.066v31.008h87.648l41.787-50.451 8.5128-2.6846 4.5655 4.7681 5.6618-6.8803-8.6347-8.8313-19.051 8.0307-48.686 12.508-7.9551-7.957h-22.289v-10.064h11.26v-10h-32.52v10h11.26v10.064h-21.561v-7.8418zm6.8164 13.197 23.273 8.6367v10.713l-25.883-9.6074zm138.24 13.243-32.018 37.78h-72.947v-31.498h49.707l9.2441 9.2441z" />
            <path fill="currentColor" d="m187.69 101.34c0.25907 2.5987 0.33343 5.3253 1.6038 7.6787 1.0182 1.9309 1.5768 4.2267 1.06 6.3859-0.50729 1.6344-1.8645 2.9226-3.3876 3.6356-1.207 0.46222-2.5574 0.39771-3.8147 0.21508-1.6372-0.43101-3.0079-1.677-3.798-3.1513-0.77169-1.6722-0.4754-3.6262 0.0322-5.331 0.58637-1.5982 1.5551-3.0653 1.815-4.7768 0.50649-2.3923 0.35025-4.8876 1.005-7.2505 0.29081-0.984 1.0024-2.0868 2.159-2.0582 0.60118-0.0108 1.5162-0.0935 2.1286 0.67862 0.84419 0.86479 1.0108 2.4669 1.1966 3.9738z" />
          </g>
          <g transform="translate(36 30) scale(0.82)">
            <circle fill="currentColor" cx="160.49" cy="167.85" r="16.049" />
            <rect fill="none" stroke="currentColor" strokeWidth="10" x="153.75" y="19.026" width="13.483" height="146.66" rx="6.7415" ry="6.7415" />
            <rect fill="currentColor" x="153.75" y="99.924" width="13.483" height="65.767" />
          </g>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <path fill="currentColor" d="m179.35 155.18c4.4436 7.6995-1.1132 17.322-10.003 17.322h-138.7c-8.8898 0-14.446-9.6227-10.003-17.322l70.857-122.77c3.7759-6.5427 13.219-6.5427 16.995 0zm-149.5 4.7497a1.1293 1.1292 0 0 0 0.97797 1.6938h138.34a1.1293 1.1292 0 0 0 0.97797-1.6938l-69.172-119.81a1.1292 1.1292 0 0 0-1.9558 0z" />
          <path fill="currentColor" d="m107.6 146.96a7.6029 7.6029 0 0 1-7.6029 7.6029 7.6029 7.6029 0 0 1-7.6029-7.6029 7.6029 7.6029 0 0 1 7.6029-7.6029 7.6029 7.6029 0 0 1 7.6029 7.6029zm-7.6031-85.696a10.675 10.675 0 0 0-10.674 10.674 10.675 10.675 0 0 0 0.04492 0.63281h-0.02734l3.0664 51.619h0.01953a7.6029 7.6029 0 0 0 7.5703 7.1524 7.6029 7.6029 0 0 0 7.5703-7.1524h0.0195l3.0664-51.619h-0.0254a10.675 10.675 0 0 0 0.0449-0.63281 10.675 10.675 0 0 0-10.676-10.674z" />
        </svg>
      );
  }
}
