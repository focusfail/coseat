import { useNavigate, useParams } from "react-router";
import './index.css'
import { Fault } from "./Fault";
import 'material-icons/iconfont/material-icons.css';
import {Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis}from 'recharts';
import { timeDuration } from "../../utils/timeDuration";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DeleteConfirmationModal } from "./DeleteModal";
import { WarningLights, type AnomalyEvent } from "./WarningLights";

const SERIES_COLORS = {
  light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#008300", "#6250d6"],
  dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#008300", "#9085e9"],
};
const ENGINE_SERIES = [
  { key: "power", name: "Leistung" },
  { key: "rpm", name: "Drehzahl (×100 U/min)" },
  { key: "fuel_flow", name: "Kraftstofffluss" },
  { key: "fuel_pressure", name: "Kraftstoffdruck" },
  { key: "oil_pressure", name: "Öldruck" },
  { key: "oil_temperature", name: "Öltemperatur" },
];
const CSV_ENGINE_KEY: Record<string, string> = {
  oil_temperature: "fuel_flow",
  oil_pressure: "fuel_pressure",
  fuel_flow: "oil_pressure",
  fuel_pressure: "oil_temperature",
};
const FLIGHT_SERIES = [
  { key: "ias", name: "Geschwindigkeit (kt)" },
  { key: "alt", name: "Flughöhe (ft)" },
  { key: "pitch", name: "Längsneigung (°)" },
  { key: "roll", name: "Querneigung (°)" },
  { key: "vspd", name: "Steigrate" },
];

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return dark;
}

function SeriesToggles({ series, colors, hidden, onToggle }: {
  series: { key: string; name: string }[];
  colors: string[];
  hidden: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="seriesToggles" role="group" aria-label="Messwerte anzeigen">
      {series.map((l, i) => (
        <label key={l.key} className="seriesToggle">
          <input type="checkbox" checked={!hidden.has(l.key)} onChange={() => onToggle(l.key)} />
          <span className="seriesSwatch" style={{ background: colors[i] }} aria-hidden="true" />
          {l.name}
        </label>
      ))}
    </div>
  );
}


export async function clientLoader({params}: Route.LoaderArgs) {
  const request = fetch("/api/flight?id=" + params.flightId, {
    method: "GET",
  })
  let response = await request;
  var flightData = await response.json();
  return flightData
}

export function HydrateFallback() {
  return (
    <div className="loadingSpinner" role="status" aria-label="Lädt">
      <span />
    </div>
  )
}

function checkExists(string: String) {
  if (string) {
    return string
  } else {
    return "Nicht angegeben"
  }
}

function showKind(kind: String) {
  if (kind == "xplane12") {
    return "X-Plane 12";
  } else if (kind == "csv") {
    return "CSV";
  } else {
    return "N/A"
  }
}

export default function Index({loaderData}: Route.ComponentProps) {
  let params = useParams();
  const navigate = useNavigate();
  const {id, airplane, startDate, endDate, fileName, json, kind} = loaderData
  var {error, friendlyMessage, message} = loaderData
  const flightData = useMemo(() => {
    if (error) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }, [json, error]);
  if (!error && !flightData) {
    message = "json.parse() failed"
    friendlyMessage = "Fehler beim Einlesen des Fluglogs. Vielleicht kann das Problem durch ein neues Hochladen gelöst werden."
    error = true;
  }
  const seriesColors = SERIES_COLORS[useDarkMode() ? "dark" : "light"];
  const anomalyThreshold = 0.5;
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(() => new Set());
  const toggleSeries = (key: string) => setHiddenSeries((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const chartData = useMemo(() => !flightData ? [] : flightData.timestamps.map((timestamp: string, index: number) => ({
      timestamp,
      power: flightData.engine_0.power[index],
      rpm: flightData.engine_0.rpm[index] / 100,
      fuel_flow: flightData.engine_0.fuel_flow[index],
      fuel_pressure: flightData.engine_0.fuel_pressure[index],
      oil_pressure: flightData.engine_0.oil_pressure[index],
      oil_temperature: flightData.engine_0.oil_temperature[index],
      ias: flightData.transform.ias[index],
      alt: flightData.transform.alt[index],
      lat: flightData.transform.lat[index],
      lon: flightData.transform.lon[index],
      pitch: flightData.transform.pitch[index],
      roll: flightData.transform.roll[index],
      vspd: flightData.transform.vspd[index],
      anomalyScore: flightData.anomaly_scores?.[index] ?? 0
  })), [flightData]);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  if (error) {
    return(
      <>
        <h1>Es ist ein Fehler aufgetreten.</h1>
        <h3>{friendlyMessage}</h3>
        <h4 style={{fontFamily: "monospace", color: "#b50303"}}>{message}. Flight Number {id}.</h4>
      </>
    )
  }
  const timeIndex = new Map<string, number>();
  chartData.forEach((d: {timestamp: string}, i: number) => { if (!timeIndex.has(d.timestamp)) timeIndex.set(d.timestamp, i) });
  const eventsIn = (a: number, b: number) => (flightData.anomaly_events ?? []).filter((e: AnomalyEvent) =>
    (timeIndex.get(e.start) ?? Infinity) <= b && a <= (timeIndex.get(e.end) ?? -Infinity));

  const faultRanges: {start: number; end: number; maxScore: number}[] = [];
  chartData.forEach((d: {anomalyScore: number}, i: number) => {
    if (d.anomalyScore < anomalyThreshold) return;
    const last = faultRanges[faultRanges.length - 1];
    if (last && last.end === i - 1) {
      last.end = i;
      last.maxScore = Math.max(last.maxScore, d.anomalyScore);
    } else {
      faultRanges.push({start: i, end: i, maxScore: d.anomalyScore});
    }
  });

  const anomalyTimestamps: string[] = chartData
    .filter(({anomalyScore}: {anomalyScore: number}) => anomalyScore >= anomalyThreshold)
    .map(({timestamp}: {timestamp: string}) => timestamp);

  const handleDeleteClick = (id: string) => {
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch("/api/flight?id=" + id, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Flug konnte nicht gelöscht werden.");
      }
      navigate("../flights");
    } catch (error) {
      alert("Flug konnte nicht gelöscht werden.");
      console.error(error);
    }
  };

  return(
    <>

      <div className="chartContainer">
      <div className="flightInfoColumn">
      <div className={"flightTitleDiv"}>
        <div className="fileNameDiv">
          <div className="fileNameRow">
            <span className="fileNameTitle">
              {fileName}
            </span>
            <div className="kindDiv">
              {showKind(flightData.kind)}
            </div>
            <button
              className="deleteButton"
              type="button"
              title="Flug löschen"
              onClick={() => handleDeleteClick(id)}
            >
              <span className="material-icons" aria-hidden="true">delete</span>
            </button>
          </div>
          <WarningLights events={flightData.anomaly_events ?? []} />
        </div>
        <div className="propertyDiv">
          <span className="propertyTitle">
            <span className="material-icons">schedule</span>
            Dauer
          </span>
          <span className="property">
            {timeDuration(new Date(startDate), new Date(endDate))}
          </span>
        </div>
        <div className="propertyDiv">
          <span className="propertyTitle">
            <span className="material-icons">airplanemode_active</span>
            Flugzeug
          </span>
          <span className="property">
            {checkExists(airplane)}
          </span>
        </div>
        <div className="propertyDiv">
          <span className="propertyTitle">
            <span className="material-icons">flight_takeoff</span>
            Start
          </span>
          <span className="property">
            {startDate}
          </span>
        </div>
        <div className="propertyDiv">
          <span className="propertyTitle">
            <span className="material-icons">flight_land</span>
            Landung
          </span>
          <span className="property">
            {endDate}
          </span>
        </div>
      </div>
        <div className="chartDiv">
          <span className="chartTitle">
            Fehler im Motorbetrieb
          </span>
          <div className="faultList">
            {faultRanges.map((r) => (
              <Fault
                key={r.start}
                start={chartData[r.start].timestamp}
                end={chartData[r.end].timestamp}
                score={r.maxScore}
                events={eventsIn(r.start, r.end)}
              />
            ))}
            {faultRanges.length === 0 && (
              <span className="faultEmpty">Keine Auffälligkeiten erkannt</span>
            )}
          </div>
        </div>
      </div>
      <div className="flightChartsColumn">
        <div className="chartDiv">
          <span className="chartTitle">
            Triebwerk
          </span>
          <SeriesToggles series={ENGINE_SERIES} colors={seriesColors} hidden={hiddenSeries} onToggle={toggleSeries} />
          <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <XAxis dataKey="timestamp" hide />
            {ENGINE_SERIES.map((l, i) => (
              <Line key={l.key} type="monotone" dataKey={flightData.kind === "csv" ? (CSV_ENGINE_KEY[l.key] ?? l.key) : l.key} name={l.name} hide={hiddenSeries.has(l.key)} stroke={seriesColors[i]} strokeWidth={2} dot={false} isAnimationActive={false} />
            ))}
            {anomalyTimestamps.map(timestamp => (
              <ReferenceLine
                key={timestamp}
                x={timestamp}
                stroke="#ff3898"
                strokeWidth={4}
              />
            ))}
            <YAxis/>
            <Tooltip/>
          </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chartDiv">
          <span className="chartTitle">
            Flugparameter
          </span>
          <SeriesToggles series={FLIGHT_SERIES} colors={seriesColors} hidden={hiddenSeries} onToggle={toggleSeries} />
          <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <XAxis dataKey="timestamp" hide />
            {FLIGHT_SERIES.map((l, i) => (
              <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} hide={hiddenSeries.has(l.key)} stroke={seriesColors[i]} strokeWidth={2} dot={false} isAnimationActive={false} />
            ))}
            <YAxis/>
            <Tooltip/>
          </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      </div>
      <DeleteConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Flug wirklich löschen?"
        message=""
      />
    </>
  )
  }
