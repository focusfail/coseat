from __future__ import annotations

import math
import random

import torch

RPM, LOAD, OILP, OILT = range(4)
KINDS = ("oil_press_decay", "oil_temp_runaway", "oil_press_osc", "rpm_hunting", "power_loss", "sensor_glitch")


def _flight_start(x: torch.Tensor, min_len: int, rnd: random.Random) -> int | None:
    rpm = torch.nan_to_num(x[:, RPM], nan=0.0)
    ok = (rpm > 1200).int()
    T = len(rpm)
    if T < min_len + 5:
        return None
    cs = torch.cat([torch.zeros(1, dtype=torch.int64), ok.cumsum(0)])
    cands = [s for s in range(0, T - min_len) if cs[s + min_len] - cs[s] == min_len]
    return rnd.choice(cands) if cands else None


def inject(x: torch.Tensor, y: torch.Tensor, rnd: random.Random, kind: str | None = None):
    x = x.clone()
    y = y.clone()
    kind = kind or rnd.choice(KINDS)
    T = x.shape[0]
    L = rnd.randint(25, 90)
    s = _flight_start(x, L, rnd)
    if s is None:
        return x, y, None
    e = s + L
    t = torch.arange(L, dtype=torch.float32)

    if kind == "oil_press_decay" and not torch.isnan(x[s:e, OILP]).all():
        f = rnd.uniform(0.15, 0.5)
        ramp = 1 - (1 - f) * (t / L)
        orig = x[s:e, OILP].clone()
        x[s:e, OILP] = orig * ramp
        x[e:, OILP] = x[e:, OILP] * f
        dev = (1 - ramp) > 0.18
        y[s:e] = torch.maximum(y[s:e], dev.float())
        y[e:] = 1
    elif kind == "oil_temp_runaway" and not torch.isnan(x[s:e, OILT]).all():
        rate = rnd.uniform(0.2, 0.7)
        add = rate * t
        x[s:e, OILT] = torch.clamp(x[s:e, OILT] + add, max=170)
        x[e:, OILT] = torch.clamp(x[e:, OILT] + rate * L, max=170)
        y[s:e] = torch.maximum(y[s:e], (add > 10).float())
        if rate * L > 10:
            y[e:] = 1
    elif kind == "oil_press_osc" and not torch.isnan(x[s:e, OILP]).all():
        amp = rnd.uniform(0.6, 1.6)
        per = rnd.uniform(2.0, 8.0)
        x[s:e, OILP] = torch.clamp(x[s:e, OILP] + amp * torch.sin(2 * math.pi * t / per), min=0.2)
        y[s + 3:e] = 1
    elif kind == "rpm_hunting" and not torch.isnan(x[s:e, RPM]).all():
        amp = rnd.uniform(70, 260)
        per = rnd.uniform(3.0, 10.0)
        osc = torch.sin(2 * math.pi * t / per)
        x[s:e, RPM] = x[s:e, RPM] + amp * osc
        if not torch.isnan(x[s:e, LOAD]).all():
            x[s:e, LOAD] = torch.clamp(x[s:e, LOAD] - 0.02 * amp * osc, 0, 100)
        y[s + 4:e] = 1
    elif kind == "power_loss" and not torch.isnan(x[s:e, LOAD]).all():
        f = rnd.uniform(0.3, 0.7)
        drop = rnd.uniform(400, 900)
        ramp = torch.clamp(t / rnd.uniform(1, 3), max=1.0)
        rough = ramp * torch.randn(L)
        x[s:e, LOAD] = torch.clamp(x[s:e, LOAD] * (1 - (1 - f) * ramp) + rough * rnd.uniform(2, 6), 0, 100)
        x[s:e, RPM] = torch.clamp(x[s:e, RPM] - drop * ramp + rough * rnd.uniform(20, 60), min=700)
        y[s + 1:e] = 1
    elif kind == "sensor_glitch":
        ch = rnd.choice([OILP, OILT])
        if torch.isnan(x[s:e, ch]).all():
            return x, y, None
        g = rnd.randint(2, 10)
        bad = rnd.choice([0.0, -40.0, -273.1] if ch == OILT else [0.0, 12.0])
        x[s:s + g, ch] = bad
        y[s:s + g] = 1
    else:
        return x, y, None
    return x, y, kind
