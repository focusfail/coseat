import io
import csv
from datetime import timedelta
from pathlib import Path
from typing import List, Optional, Literal, TextIO, Union, BinaryIO, Text
from pprint import pprint

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
    ias: List[float] = Field(default_factory=list)
    lat: List[float] = Field(default_factory=list)
    lon: List[float] = Field(default_factory=list)
    alt: List[float] = Field(default_factory=list)
    pitch: List[float] = Field(default_factory=list)
    roll: List[float] = Field(default_factory=list)
    vspd: List[float] = Field(default_factory=list)

    def append_datapoints(
        self,
        ias: float,
        lat: float,
        lon: float,
        alt: float,
        pitch: float,
        roll: float,
        vspd: float,
    ):
        self.ias.append(ias)
        self.lat.append(lat)
        self.lon.append(lon)
        self.alt.append(alt)
        self.pitch.append(pitch)
        self.roll.append(roll)
        self.vspd.append(vspd)


class FlightData(BaseModel):
    kind: Literal["csv", "xplane12"] = "csv"
    engine_0: Optional[EngineData] = None
    engine_1: Optional[EngineData] = None
    transform: Optional[TransformData] = None
    timestamps: List[str] = Field(default_factory=list)
    airframe_name: str = Field(default_factory=str)

    @staticmethod
    def read(
        source: Union[str, Path, bytes, BinaryIO, TextIO],
        filename: Optional[str] = None,
    ) -> "FlightData":
        if filename is None and isinstance(source, (str, Path)):
            filename = str(source)

        text: TextIO
        if isinstance(source, (str, Path)):
            text = io.StringIO(Path(source).read_text(encoding="utf-8-sig"))
        elif isinstance(source, bytes):
            text = io.StringIO(source.decode("utf-8-sig"))
        else:
            content = source.read()
            if isinstance(content, bytes):
                content = content.decode("utf-8-sig")

            text = io.StringIO(content)

        kind = "csv" if filename and filename.split(".")[1] == "csv" else "xplane12"

        if kind == "xplane12":
            print("1")
            return FlightData.read_xplane12(text)
        return FlightData.read_csv(text)

    @staticmethod
    def read_csv(csvfile: TextIO) -> "FlightData":
        fd = FlightData()
        fd.engine_0 = EngineData()
        fd.engine_1 = EngineData()
        fd.transform = TransformData()

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
                dict_get_float(row, "IAS"),
                dict_get_float(row, "Latitude"),
                dict_get_float(row, "Longitude"),
                dict_get_float(row, "AltInd"),
                dict_get_float(row, "Pitch"),
                dict_get_float(row, "Roll"),
                dict_get_float(row, "VSpd"),
            )

            date = row.get("Lcl Date")
            time = row.get("Lcl Time")
            fd.timestamps.append(f"{date} {time}")

        # Check if plane has 1 or 2 engines
        if all(v == -0.0 for v in fd.engine_1.power):
            fd.engine_1 = None

        return fd

    @staticmethod
    def read_xplane12(xplane_file: TextIO) -> "FlightData":
        print("2")
        fd = FlightData()
        fd.engine_0 = EngineData()
        fd.engine_1 = None
        fd.transform = TransformData()
        fd.kind = "xplane12"

        lines = [ll for l in xplane_file if (ll := l.strip())]
        headers = [hh for h in lines[0].split("|") if (hh := h.strip())]
        data_lines = [
            [d.strip() for d in ll] for l in lines[1::10] if (ll := l.split("|"))
        ]

        data = [dict(zip(headers, line)) for line in data_lines]
        for row in data:
            time_str = str(timedelta(hours=float(row["_zulu,_time"])))
            time_str = time_str.split(".")[0]  # remove ms
            fd.timestamps.append(f"2026-11-03 {time_str}")

            fd.engine_0.append_datapoints(
                power=0.0,  # missing
                rpm=0.0,  # missing
                oil_p=float(row["OILP1,__psi"]),
                oil_t=float(row["OILT1,__deg"]),
                fuel_p=float(row["FUEP1,__psi"]),
                fuel_f=0.0,  # missing
            )

            fd.transform.append_datapoints(
                ias=float(row["_Vind,_kias"]),
                lat=float(row["__lat,__deg"]),
                lon=float(row["__lon,__deg"]),
                alt=float(row["p-alt,ftMSL"]),
                pitch=float(row["pitch,__deg"]),
                roll=float(row["_roll,__deg"]),
                vspd=0.0,  # missing
            )

            # TODO: engine 2 if available

        return fd
