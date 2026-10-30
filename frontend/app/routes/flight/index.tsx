import { useNavigate, useParams } from "react-router";
import './index.css'
import { Fault } from "./Fault";
import 'material-icons/iconfont/material-icons.css';
import {Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis}from 'recharts';
import { timeDuration } from "../../utils/timeDuration";
import { useState } from "react";
import { DeleteConfirmationModal } from "./DeleteModal";
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

export default function Index({loaderData}: Route.ComponentProps) {
  let params = useParams();
  const navigate = useNavigate();
  const {id, airplane, startDate, endDate, fileName, json} = loaderData
  var {error, friendlyMessage, message} = loaderData
  if (!error) {
    try {
      var flightData = JSON.parse(json);
    } catch {
      message = "json.parse() failed"
      friendlyMessage = "Fehler beim Einlesen des Fluglogs. Vielleicht kann das Problem durch ein neues Hochladen gelöst werden."
      error = true;
    }
  }
  if (error) {
    return(
      <>
        <h1>Es ist ein Fehler aufgetreten.</h1>
        <h3>{friendlyMessage}</h3>
        <h4 style={{fontFamily: "monospace", color: "#b50303"}}>{message}. Flight Number {id}.</h4>
      </>
    )
  }
  const anomalyThreshold = 0.5;
  const chartData = flightData.timestamps.map((timestamp, index) => ({
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
      anomalyScore: Math.random() < 0.01 ? 0.5 + Math.random() * 0.5 : Math.random() * 0.5
  }));
  const anomalyTimestamps = chartData
    .filter(({anomalyScore}) => anomalyScore >= anomalyThreshold)
    .map(({timestamp}) => timestamp);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

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
  console.log(chartData);
  return(
    <>

      <div className="chartContainer">
      <div className={"flightTitleDiv"}>
        <div className="fileNameDiv">
          <span className="fileNameTitle">
            {fileName}
          </span>
          <button
            className="deleteButton"
            type="button"
            aria-label="Flug löschen"
            title="Flug löschen"
            onClick={() => handleDeleteClick(id)}
          >
            <span className="material-icons" aria-hidden="true">delete</span>
          </button>
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
            {airplane}
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
            {chartData.map((dataPoint: {timestamp: string; anomalyScore: number}, index: number) => {
              if (dataPoint.anomalyScore >= anomalyThreshold) {
                return (
                  <Fault key={index} time={dataPoint.timestamp} value={dataPoint.anomalyScore.toFixed(2)} />
                );
              }
              return null;
            })}
          </div>
        </div>
        <div className="chartDiv">
          <span className="chartTitle">
            Triebwerk
          </span>
          <LineChart width={500} height={250} data={chartData}>
            <XAxis dataKey="timestamp" hide />
            <Line type="monotone" dataKey="power" stroke="#82ca9d" dot={{fill: "#82ca9d"}} />
            <Line type="monotone" dataKey="rpm" name="RPM x100" stroke="#8884d8" dot={{fill: "#8884d8"}} />
            <Line type="monotone" dataKey="fuel_flow" stroke="#ffc658" dot={{fill: "#ffc658"}} />
            <Line type="monotone" dataKey="fuel_pressure" stroke="#ffc658" dot={{fill: "#ffc658"}} />
            <Line type="monotone" dataKey="oil_pressure" stroke="#ffc658" dot={{fill: "#ffc658"}} />
            <Line type="monotone" dataKey="oil_temperature" stroke="#ffc658" dot={{fill: "#ffc658"}} />
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
        </div>
        <div className="chartDiv">
          <span className="chartTitle">
            Flugparameter
          </span>
          <LineChart width={500} height={250} data={chartData}>
            <Line type="monotone" dataKey="ias" stroke="#8884d8" dot={{fill: "#8884d8"}} />
            <Line type="monotone" dataKey="alt" stroke="#82ca9d" dot={{fill: "#82ca9d"}} />
            <Line type="monotone" dataKey="pitch" stroke="#82ca9d" dot={{fill: "#82ca9d"}} />
            <Line type="monotone" dataKey="roll" stroke="#82ca9d" dot={{fill: "#82ca9d"}} />
            <Line type="monotone" dataKey="vspd" stroke="#ffc658" dot={{fill: "#ffc658"}} />
            <YAxis/>
            <Tooltip/>
          </LineChart>
        </div>
      </div>
      <DeleteConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Flug wirklich löschen?"
        message="Möchtest du den Flug wirklich löschen? Er kann danach nicht wiederhergestellt werden."
      />
    </>
  )
  }
