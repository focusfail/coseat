from __future__ import annotations

import argparse
import glob
import json
import math
import os
import random
import time
import warnings
from pathlib import Path

warnings.filterwarnings("ignore", message="Failed to initialize NumPy")
import torch
import torch.nn.functional as F

from .features import CHANNELS, read_eecu_log
from .labeling import label_log
from .model import N_IN, EngineLSTM, encode
from .synth import KINDS, inject

HERE = Path(__file__).parent
RPM, LOAD, OILP, OILT = range(4)

LR = 1e-3
P_FAULT = 0.35
REAL_OVERSAMPLE = 4
P_SHARPEN = 0.4
KIND_WEIGHTS = {"oil_press_decay": 1, "oil_temp_runaway": 1, "oil_press_osc": 2,
                "rpm_hunting": 2, "power_loss": 2, "sensor_glitch": 2}
EVENT_SECONDS = 40.0
SHORT = {"oil_press_decay": "ÖlDruckAbfall", "oil_temp_runaway": "ÖlTemp", "oil_press_osc": "ÖlDruckSchw",
         "rpm_hunting": "Pendeln", "power_loss": "Leistung", "sensor_glitch": "Sensor"}


def load_logs(data_dir: str):
    logs = []
    for f in sorted(glob.glob(os.path.join(data_dir, "*.csv"))):
        log = read_eecu_log(Path(f))
        if len(log.x) < 20:
            continue
        labels, counts = label_log(log)
        x = torch.tensor([[float("nan") if v is None else v for v in r] for r in log.x], dtype=torch.float32)
        logs.append({"name": log.name, "x": x, "y": torch.tensor(labels, dtype=torch.float32), "counts": counts})
    return logs


def split(logs, val_frac: float, rnd: random.Random):
    pos = [l for l in logs if l["y"].sum() > 0]
    neg = [l for l in logs if l["y"].sum() == 0]
    rnd.shuffle(pos)
    rnd.shuffle(neg)
    kp, kn = max(1, round(len(pos) * val_frac)), max(1, round(len(neg) * val_frac))
    return pos[kp:] + neg[kn:], pos[:kp] + neg[:kn]


def windows(logs, W: int, stride: int):
    out = []
    for li, l in enumerate(logs):
        T = len(l["y"])
        if T <= W:
            out.append((li, 0, T))
        else:
            for s in range(0, T - W + 1, stride):
                out.append((li, s, s + W))
            if (T - W) % stride:
                out.append((li, T - W, T))
    return out


def sharpen_power_changes(x: torch.Tensor, rnd: random.Random) -> torch.Tensor:
    x = x.clone()
    load = x[:, LOAD]
    T = len(load)
    i = 0
    while i < T - 12:
        a, b = i, i + 10
        if not (torch.isnan(load[a]) or torch.isnan(load[b])) and abs(float(load[b] - load[a])) > 30:
            sign = 1 if load[b] > load[a] else -1
            while b + 1 < T and not torch.isnan(load[b + 1]) and sign * float(load[b + 1] - load[b]) > 1:
                b += 1
            k = rnd.randint(0, 2)
            mid = a + rnd.randint(0, b - a - k)
            for ch in (LOAD, RPM):
                va, vb = x[a, ch].clone(), x[b, ch].clone()
                x[a:mid, ch] = va
                x[mid:mid + k, ch] = va + (vb - va) * torch.arange(1, k + 1, dtype=torch.float32) / (k + 1)
                x[mid + k:b, ch] = vb
            if sign > 0 and rnd.random() < 0.5 and mid + k < T:
                x[mid + k, RPM] += rnd.uniform(10, 35)
            i = b
        else:
            i += 1
    return x


def augment(x: torch.Tensor, y: torch.Tensor, rnd: random.Random, p_fault: float):
    w = torch.ones_like(y)
    if rnd.random() < P_SHARPEN:
        x = sharpen_power_changes(x, rnd)
    if rnd.random() < p_fault:
        kind = rnd.choices(list(KIND_WEIGHTS), weights=list(KIND_WEIGHTS.values()))[0]
        x2, y2, k = inject(x, y, rnd, kind)
        if k:
            new = (y2 > 0.5) & (y < 0.5)
            n = int(new.sum())
            if n:
                w[new] = min(4.0, max(0.15, EVENT_SECONDS / n))
            x, y = x2, y2
    x = x.clone()
    x[:, OILT] += rnd.uniform(-0.5, 0.5)
    x[:, OILP] *= rnd.uniform(0.93, 1.07)
    x[:, RPM] *= rnd.uniform(0.99, 1.01)
    x += torch.randn_like(x) * torch.tensor([3.0, 0.4, 0.03, 0.15])
    r = rnd.random()
    if r < 0.12:
        x[:, RPM] = float("nan")
        x[:, LOAD] = float("nan")
    elif r < 0.17:
        x[:, LOAD] = float("nan")
    elif r < 0.20:
        x[:, rnd.choice([OILP, OILT])] = float("nan")
    return x, y, w


def collate(samples):
    T = max(len(y) for _, y, _ in samples)
    B = len(samples)
    X = torch.zeros(B, T, N_IN)
    Y = torch.zeros(B, T)
    M = torch.zeros(B, T)
    for i, (x, y, w) in enumerate(samples):
        n = len(y)
        X[i, :n] = encode(x)
        Y[i, :n] = y
        M[i, :n] = w
    return X, Y, M


@torch.no_grad()
def predict(model, x: torch.Tensor, device) -> torch.Tensor:
    model.eval()
    return model(encode(x).unsqueeze(0).to(device)).squeeze(0).cpu()


def prf(pred: torch.Tensor, y: torch.Tensor):
    tp = float((pred & (y > 0.5)).sum())
    fp = float((pred & (y < 0.5)).sum())
    fn = float((~pred & (y > 0.5)).sum())
    p = tp / (tp + fp) if tp + fp else 0.0
    r = tp / (tp + fn) if tp + fn else 0.0
    return p, r, (2 * p * r / (p + r) if p + r else 0.0)


def build_val_sets(val, seed: int):
    rnd = random.Random(seed)
    synth = []
    for l in val:
        for kind in KINDS:
            T = len(l["y"])
            if T < 200:
                continue
            s = rnd.randint(0, max(0, T - 900))
            x, y, k = inject(l["x"][s:s + 900], l["y"][s:s + 900], rnd, kind)
            if k:
                synth.append({"name": f'{l["name"]}+{k}', "kind": k, "x": x, "y": y})
    return synth


def evaluate(model, real, synth, device, bias: float = 0.0):
    out = {}
    logits_r = [predict(model, l["x"], device) for l in real]
    logits_s = [predict(model, s["x"], device) for s in synth]
    allL = torch.cat(logits_r + logits_s)
    allY = torch.cat([l["y"] for l in real] + [s["y"] for s in synth])
    pr = prf(allL - bias > 0, allY)
    out["step_precision"], out["step_recall"], out["step_f1"] = pr
    pr = prf(torch.cat(logits_r) - bias > 0, torch.cat([l["y"] for l in real]))
    out["real_precision"], out["real_recall"], out["real_f1"] = pr
    by_kind = {}
    for s, lg in zip(synth, logits_s):
        hit = bool(((lg - bias > 0) & (s["y"] > 0.5)).any())
        by_kind.setdefault(s["kind"], []).append(hit)
    out["synthetic_event_recall"] = {k: round(sum(v) / len(v), 3) for k, v in by_kind.items()}
    clean = [(l, lg) for l, lg in zip(real, logits_r) if l["y"].sum() == 0]
    secs = sum(len(l["y"]) for l, _ in clean)
    flagged = sum(int((lg - bias > 0).sum()) for _, lg in clean)
    out["clean_logs"] = len(clean)
    out["clean_logs_with_alarm"] = sum(int(bool((lg - bias > 0).any())) for _, lg in clean)
    out["false_alarm_seconds_per_hour"] = round(flagged / max(secs, 1) * 3600, 2)
    clean_logits = torch.cat([lg for _, lg in clean]) if clean else torch.zeros(0)
    return out, allL, allY, clean_logits


MAX_FALSE_ALARM_PER_H = 0.5


def calibrate(allL: torch.Tensor, allY: torch.Tensor, clean: torch.Tensor) -> float:
    best, best_t = -1.0, 6.0
    for t in torch.linspace(-4, 6, 101):
        fa = float((clean > t).sum()) / max(len(clean), 1) * 3600
        if fa > MAX_FALSE_ALARM_PER_H:
            continue
        f1 = prf(allL > t, allY)[2]
        if f1 > best:
            best, best_t = f1, float(t)
    return best_t


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", default=str(HERE / "engine_lstm.pt"))
    ap.add_argument("--epochs", type=int, default=18)
    ap.add_argument("--window", type=int, default=240)
    ap.add_argument("--batch", type=int, default=32)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--device", default="cpu")
    args = ap.parse_args()

    rnd = random.Random(args.seed)
    torch.manual_seed(args.seed)
    device = torch.device(args.device)

    t0 = time.time()
    logs = load_logs(args.data)
    train, val = split(logs, 0.2, rnd)
    synth_val = build_val_sets(val, args.seed + 1)
    win = windows(train, args.window, args.window // 2)
    win += [w for w in win if train[w[0]]["y"][w[1]:w[2]].sum() > 0] * (REAL_OVERSAMPLE - 1)
    n_pos = sum(int(l["y"].sum()) for l in train)
    print(f"{len(logs)} Logs ({len(train)} Training / {len(val)} Validierung), {len(win)} Fenster, "
          f"{n_pos} gelabelte Sekunden im Training, Laden {time.time() - t0:.0f}s", flush=True)

    model = EngineLSTM().to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=1e-4)
    steps = args.epochs * math.ceil(len(win) / args.batch)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=LR, total_steps=steps, pct_start=0.15)
    pos_weight = torch.tensor(3.0, device=device)

    best_score, best_state, best_bias, history = -1.0, None, 0.0, []
    for ep in range(args.epochs):
        model.train()
        rnd.shuffle(win)
        tl, tn, te = 0.0, 0, time.time()
        for b in range(0, len(win), args.batch):
            samples = []
            for li, s, e in win[b:b + args.batch]:
                l = train[li]
                samples.append(augment(l["x"][s:e], l["y"][s:e], rnd, p_fault=P_FAULT))
            X, Y, M = (t.to(device) for t in collate(samples))
            logits = model(X)
            loss = (F.binary_cross_entropy_with_logits(logits, Y, pos_weight=pos_weight, reduction="none") * M).sum() / (M > 0).sum()
            opt.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            sched.step()
            tl += loss.item() * len(samples)
            tn += len(samples)
        _, allL, allY, clean = evaluate(model, val, synth_val, device)
        ep_bias = calibrate(allL, allY, clean)
        m, *_ = evaluate(model, val, synth_val, device, ep_bias)
        score = m["real_f1"] + 0.5 * m["step_f1"]
        history.append({"epoch": ep + 1, "loss": round(tl / tn, 4), "logit_bias": round(ep_bias, 2), "score": round(score, 3),
                        **{k: (round(v, 3) if isinstance(v, float) else v) for k, v in m.items()}})
        rec = " ".join(f"{SHORT[k]}={v:.2f}" for k, v in m["synthetic_event_recall"].items())
        print(f"Epoche {ep + 1:2d}  loss {tl / tn:.4f}  F1 {m['step_f1']:.3f}  real-F1 {m['real_f1']:.3f}  "
              f"Fehlalarm {m['false_alarm_seconds_per_hour']}/h  Score {score:.3f}  [{rec}]  {time.time() - te:.0f}s", flush=True)
        if score > best_score:
            best_score, best_bias = score, ep_bias
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}

    model.load_state_dict(best_state)
    bias = best_bias
    final, *_ = evaluate(model, val, synth_val, device, bias)
    print("Kalibrierte Schwelle (Logit):", round(bias, 3))
    print(json.dumps(final, indent=2))

    torch.save({
        "version": 1,
        "channels": list(CHANNELS),
        "state_dict": best_state,
        "logit_bias": bias,
        "config": {"n_in": N_IN, "hidden": 64, "layers": 2},
    }, args.out)
    label_totals = {}
    for l in logs:
        for k, v in l["counts"].items():
            label_totals[k] = label_totals.get(k, 0) + v
    with open(Path(args.out).with_name("metrics.json"), "w") as f:
        json.dump({
            "trained_at": time.strftime("%Y-%m-%d %H:%M"),
            "logs": len(logs), "train_logs": len(train), "val_logs": len(val),
            "val_log_names": sorted(l["name"] for l in val),
            "label_seconds_by_reason": label_totals,
            "logit_bias": bias, "validation": final, "history": history,
        }, f, indent=2, ensure_ascii=False)
    print(f"gespeichert: {args.out}  ({time.time() - t0:.0f}s)")


if __name__ == "__main__":
    main()
