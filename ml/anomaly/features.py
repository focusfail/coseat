from __future__ import annotations

import csv
import math
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional, Sequence

CHANNELS = ("rpm", "load", "oil_press", "oil_temp")
SCALE = (2300.0, 100.0, 5.0, 100.0)

PSI_TO_BAR = 0.0689476

Row = List[Optional[float]]


def f_to_c(f: float) -> float:
    return (f - 32.0) * 5.0 / 9.0


def _missing(v: Optional[float]) -> bool:
    return v is None or math.isnan(v) or (v == 0.0 and math.copysign(1.0, v) < 0)


def _series(values: Sequence[float], n: int, conv=lambda v: v) -> List[Optional[float]]:
    out = [None if i >= len(values) or _missing(values[i]) else conv(values[i]) for i in range(n)]
    if all(v is None or v == 0 for v in out):
        return [None] * n
    return out


def from_flight_data(fd) -> List[Row]:
    n = len(fd.timestamps)
    e = fd.engine_0
    if e is None or n == 0:
        return [[None] * 4 for _ in range(n)]

    if fd.kind == "csv":
        oil_t_f, oil_p_psi = e.fuel_flow, e.fuel_pressure
    else:
        oil_t_f, oil_p_psi = e.oil_temperature, e.oil_pressure

    power = [v for v in e.power if not _missing(v)]
    p_scale = 100.0 if power and max(power) <= 1.5 else 1.0

    cols = [
        _series(e.rpm, n),
        _series(e.power, n, lambda v: v * p_scale),
        _series(oil_p_psi, n, lambda v: v * PSI_TO_BAR),
        _series(oil_t_f, n, f_to_c),
    ]
    return [[c[i] for c in cols] for i in range(n)]


@dataclass
class EecuLog:

    name: str
    timestamps: List[str] = field(default_factory=list)
    x: List[Row] = field(default_factory=list)
    pla: List[float] = field(default_factory=list)
    status: List[int] = field(default_factory=list)


EECU_COLS = {
    "rpm": "Propeller Speed [rpm]",
    "load": "Engine Load [%]",
    "oil_press": "Engine Oil Pressure [hPa]",
    "oil_temp": "Engine Oil Temperature [deg C]",
    "pla": "Power Lever Position [%]",
    "status": "Engine Status [bin]",
}


def _num(s: str) -> Optional[float]:
    try:
        return float(s)
    except (TypeError, ValueError):
        return None


def read_eecu_log(path: Path) -> EecuLog:
    log = EecuLog(name=Path(path).stem)
    with open(path, newline="", encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            rpm = _num(row[EECU_COLS["rpm"]])
            load = _num(row[EECU_COLS["load"]])
            oilp = _num(row[EECU_COLS["oil_press"]])
            oilt = _num(row[EECU_COLS["oil_temp"]])
            log.timestamps.append(row["Timestamp"])
            log.x.append([rpm, load, None if oilp is None else oilp / 1000.0, oilt])
            log.pla.append(_num(row[EECU_COLS["pla"]]) or 0.0)
            log.status.append(int(_num(row[EECU_COLS["status"]]) or 0))
    return log


def to_model_input(rows: Sequence[Row]) -> List[List[float]]:
    out = []
    for r in rows:
        vals = [0.0 if v is None else v / s for v, s in zip(r, SCALE)]
        mask = [0.0 if v is None else 1.0 for v in r]
        out.append(vals + mask)
    return out
