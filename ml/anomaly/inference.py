from __future__ import annotations

import hashlib
import warnings
from pathlib import Path
from typing import List, Optional, Sequence

warnings.filterwarnings("ignore", message="Failed to initialize NumPy")
import torch

from .explain import events
from .features import Row, from_flight_data
from .model import EngineLSTM, encode

MODEL_PATH = Path(__file__).parent / "engine_lstm.pt"

_model: Optional[EngineLSTM] = None
_bias = 0.0
_version: Optional[str] = None


def model_version() -> str:
    global _version
    if _version is None:
        _version = hashlib.sha256(MODEL_PATH.read_bytes()).hexdigest()[:12]
    return _version


def _load() -> EngineLSTM:
    global _model, _bias
    if _model is None:
        ckpt = torch.load(MODEL_PATH, map_location="cpu", weights_only=True)
        cfg = ckpt["config"]
        m = EngineLSTM(n_in=cfg["n_in"], hidden=cfg["hidden"], layers=cfg["layers"])
        m.load_state_dict(ckpt["state_dict"])
        m.eval()
        _model, _bias = m, float(ckpt["logit_bias"])
    return _model


@torch.no_grad()
def score_rows(rows: Sequence[Row]) -> List[float]:
    if not rows:
        return []
    model = _load()
    x = torch.tensor([[float("nan") if v is None else v for v in r] for r in rows], dtype=torch.float32)
    p = torch.sigmoid(model(encode(x).unsqueeze(0)).squeeze(0) - _bias)
    if len(p) >= 3:
        pad = torch.cat([p[:1], p, p[-1:]])
        p = pad.unfold(0, 3, 1).median(dim=1).values
    return [round(float(v), 3) for v in p]


def score_flight(fd) -> List[float]:
    return score_rows(from_flight_data(fd))


def analyse_flight(fd) -> tuple[List[float], List[dict]]:
    rows = from_flight_data(fd)
    scores = score_rows(rows)
    return scores, events(rows, scores, fd.timestamps)
