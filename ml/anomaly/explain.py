from __future__ import annotations

from typing import Dict, List, Optional, Sequence

from .features import Row

THRESHOLD = 0.5
MARGIN_S = 3
MERGE_GAP_S = 3


def _segments(scores: Sequence[float]) -> List[tuple[int, int]]:
    segs: List[tuple[int, int]] = []
    for i, s in enumerate(scores):
        if s < THRESHOLD:
            continue
        if segs and i - segs[-1][1] <= MERGE_GAP_S + 1:
            segs[-1] = (segs[-1][0], i)
        else:
            segs.append((i, i))
    return segs


def _max_step(v: List[float]) -> float:
    return max((abs(b - a) for a, b in zip(v, v[1:])), default=0.0)


def classify(rows: Sequence[Row]) -> tuple[str, str, Optional[float]]:
    rpm = [r[0] for r in rows if r[0] is not None]
    oilp = [r[2] for r in rows if r[2] is not None]
    oilt = [r[3] for r in rows if r[3] is not None]

    if any(t < -40 for t in oilt) or any(p > 10 for p in oilp):
        return "sensor", "yellow", None

    if oilp and min(oilp) < 1.0:
        return "oil_pressure", "red", min(oilp)
    if oilt and max(oilt) > 140:
        return "oil_temperature", "red", max(oilt)
    if oilt and max(oilt) > 125:
        return "oil_temperature", "yellow", max(oilt)

    if rpm and (max(rpm) - min(rpm) > 300 or _max_step(rpm) > 80 or max(rpm) > 2340):
        return "engine", "yellow", max(rpm)

    if oilp:
        low = min(oilp)
        under_power = any(r[2] is not None and r[0] is not None and r[0] > 1600 and r[2] < 2.3 for r in rows)
        dropping = oilp[0] - low > 0.25 * max(oilp[0], 0.1)
        swinging = max(oilp) - low > 0.8 and _max_step(oilp) > 0.3
        if under_power or dropping or swinging:
            return "oil_pressure", "yellow", low

    if len(oilt) > 5 and oilt[-1] - oilt[0] > 8:
        return "oil_temperature", "yellow", max(oilt)

    return "engine", "yellow", max(rpm) if rpm else None


def events(rows: Sequence[Row], scores: Sequence[float], timestamps: Sequence[str]) -> List[Dict]:
    out: List[Dict] = []
    n = len(rows)
    for a, b in _segments(scores):
        kind, severity, value = classify(rows[max(0, a - MARGIN_S):min(n, b + MARGIN_S + 1)])
        out.append({
            "kind": kind,
            "severity": severity,
            "start": timestamps[a],
            "end": timestamps[b],
            "seconds": b - a + 1,
            "value": None if value is None else round(value, 2),
            "max_score": round(max(scores[a:b + 1]), 3),
        })
    return out
