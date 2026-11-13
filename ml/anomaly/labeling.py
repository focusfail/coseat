from __future__ import annotations

from typing import Dict, List

from .features import EecuLog

OIL_TEMP_CAUTION = 125.0
OIL_PRESS_MIN = 1.0
OIL_PRESS_MIN_POWER = 2.3
OIL_PRESS_MAX = 6.5
RPM_OVERSPEED = 2340.0
RUNNING_RPM = 600.0
START_GRACE_S = 20

REASONS = (
    "oil_overtemp",
    "oil_press_low",
    "oil_press_high",
    "overspeed",
    "rpm_instability",
    "power_loss",
    "sensor_invalid",
)


def _std(v: List[float]) -> float:
    m = sum(v) / len(v)
    return (sum((x - m) ** 2 for x in v) / len(v)) ** 0.5


def label_log(log: EecuLog, dilate: int = 2) -> tuple[List[int], Dict[str, int]]:
    n = len(log.x)
    raw = [0] * n
    counts = {r: 0 for r in REASONS}

    def mark(a: int, b: int, reason: str):
        for k in range(max(0, a), min(n, b + 1)):
            if not raw[k]:
                counts[reason] += 1
            raw[k] = 1

    rpm = [r[0] or 0.0 for r in log.x]
    load = [r[1] or 0.0 for r in log.x]
    oilp = [r[2] for r in log.x]
    oilt = [r[3] for r in log.x]
    pla = log.pla

    started = -10**9
    for i in range(n):
        running = rpm[i] > RUNNING_RPM
        if not running:
            started = -10**9
            continue
        if started < 0:
            started = i
        if oilt[i] is not None and oilt[i] < -40 or (rpm[i] > 1000 and (oilp[i] is None or oilp[i] <= 0)):
            if i > 3:
                mark(i, i, "sensor_invalid")
            continue
        if oilt[i] is not None and oilt[i] > OIL_TEMP_CAUTION:
            mark(i, i, "oil_overtemp")
        if oilp[i] is not None:
            low = oilp[i] < OIL_PRESS_MIN or (rpm[i] > 1600 and oilp[i] < OIL_PRESS_MIN_POWER)
            if low and i - started > START_GRACE_S:
                mark(i, i, "oil_press_low")
            if oilp[i] > OIL_PRESS_MAX and oilt[i] is not None and oilt[i] > 40:
                mark(i, i, "oil_press_high")
        if rpm[i] > RPM_OVERSPEED:
            mark(i, i, "overspeed")

        if i >= 10:
            w = slice(i - 10, i + 1)
            if max(pla[w]) - min(pla[w]) < 2 and min(load[w]) > 30 and _std(rpm[w]) > 35:
                mark(i - 10, i, "rpm_instability")

        if i >= 3 and pla[i] > 30 and abs(pla[i] - pla[i - 3]) < 3:
            if load[i - 3] - load[i] > 20 or rpm[i - 2] - rpm[i] > 300:
                mark(i - 2, i + 5, "power_loss")

    labels = [0] * n
    for i, v in enumerate(raw):
        if v:
            for k in range(max(0, i - dilate), min(n, i + dilate + 1)):
                labels[k] = 1
    return labels, counts
