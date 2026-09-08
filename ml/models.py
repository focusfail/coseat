import csv
from pathlib import Path
from typing import List, Optional

from pydantic import BaseModel, Field

from .utils import get_airframe_name, sanitize_dict, dict_get_float


class EngineData(BaseModel):
    power: List[float] = Field(default_factory=list)
    rpm: List[float] = Field(default_factory=list)
    fuel_flow: List[float] = Field(default_factory=list)
    fuel_pressure: List[float] = Field(default_factory=list)
    oil_pressure: List[float] = Field(default_factory=list)
    oil_temperature: List[float] = Field(default_factory=list)

    def append_datapoints(
     self,
        power: float,
        rpm: float,
        fuel_f: float,
        fuel_p: float,
        oil_p: float,
        oil_t: float,
    ):
        self.power.append(power)
        self.rpm.append(rpm)
        self.fuel_flow.append(fuel_f)
        self.fuel_pressure.append(fuel_p)
        self.oil_pressure.append(oil_p)
        self.oil_temperature.append(oil_t)

class TransformData(BaseModel):
    lat: List[float] = Field(default_factory=list)
    lon: List[float] = Field(default_factory=list)
    alt: List[float] = Field(default_factory=list)
    pitch: List[float] = Field(default_factory=list)
    roll: List[float] = Field(default_factory=list)
    vspd: List[float] = Field(default_factory=list)

    def append_datapoints(
     self,
        lat: float,
        lon: float,
        alt: float,
        pitch: float,
        roll: float,
        vspd: float,
    ):
        self.lat.append(lat)
        self.lon.append(lon)
        self.alt.append(alt)
        self.pitch.append(pitch)
        self.roll.append(roll)
        self.vspd.append(vspd)


class FlightData(BaseModel):
    engine_0: Optional[EngineData] = None
    engine_1: Optional[EngineData] = None
    transform: TransformData = None
    timestamps: List[str] = Field(default_factory=list)
    airframe_name: str = Field(default_factory=str)

    @staticmethod
    def read_csv(path: Path) -> "FlightData":
        fd = FlightData()
        fd.engine_0 = EngineData()
        fd.engine_1 = EngineData()
        fd.transform = TransformData()

        with open(path, "r") as csvfile:
            info_line = csvfile.readline()
            fd.airframe_name = get_airframe_name(info_line)
            csvfile.readline()  # skip unit row
            reader = csv.DictReader(csvfile, delimiter=",")

            for row in reader:
                row = sanitize_dict(row)
                fd.engine_0.append_datapoints(
                    dict_get_float(row, "E1 %Pwr"),
                    dict_get_float(row, "E1 RPM"),
                    dict_get_float(row, "E1 OilT"),
                    dict_get_float(row, "E1 OilP"),
                    dict_get_float(row, "E1 FFlow"),
                    dict_get_float(row, "E1 FPres"),
                )
                fd.engine_1.append_datapoints(
                    dict_get_float(row, "E2 %Pwr"),
                    dict_get_float(row, "E2 RPM"),
                    dict_get_float(row, "E2 OilT"),
                    dict_get_float(row, "E2 OilP"),
                    dict_get_float(row, "E2 FFlow"),
                    dict_get_float(row, "E2 FPres"),
                )

                fd.transform.append_datapoints(
                    dict_get_float(row, "Latitude"),
                    dict_get_float(row, "Longitude"),
                    dict_get_float(row, "AltInd"),
                    dict_get_float(row, "Pitch"),
                    dict_get_float(row, "Roll"),
                    dict_get_float(row, "VSpd"),
                )

                date = row.get("Lcl Date")
                time = row.get("Lcl Time")
                fd.latitude.append(dict_get_float(row, "Latitude"))
                fd.longitude.append(dict_get_float(row, "Longitude"))
                print("append!")
                fd.timestamps.append(f"{date} {time}")

        # Check if plane has 1 or 2 engines
        if all(v == -0.0 for v in fd.engine_1.power):
            fd.engine_1 = None

        return fd
