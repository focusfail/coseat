from __future__ import annotations

import torch
import torch.nn as nn

from .features import SCALE

DSCALE = (100.0, 10.0, 0.5, 5.0)
LIMITS = ((0, 2250.0, 50.0), (3, 120.0, 5.0), (2, 1.5, -0.5))
N_IN = 15


def encode(x: torch.Tensor) -> torch.Tensor:
    mask = (~torch.isnan(x)).float()
    vals = torch.clamp(torch.nan_to_num(x / torch.tensor(SCALE, dtype=x.dtype), nan=0.0), -3.0, 3.0)
    prev = torch.cat([x[..., :1, :], x[..., :-1, :]], dim=-2)
    delta = torch.clamp(torch.nan_to_num((x - prev) / torch.tensor(DSCALE, dtype=x.dtype), nan=0.0), -3.0, 3.0)
    margin = torch.stack([torch.nan_to_num((x[..., c] - ref) / sc, nan=-3.0) for c, ref, sc in LIMITS], dim=-1)
    return torch.cat([vals, delta, torch.clamp(margin, -3.0, 3.0), mask], dim=-1)


class EngineLSTM(nn.Module):

    def __init__(self, n_in: int = N_IN, hidden: int = 64, layers: int = 2, dropout: float = 0.15):
        super().__init__()
        self.inp = nn.Sequential(nn.Linear(n_in, hidden), nn.GELU())
        self.lstm = nn.LSTM(hidden, hidden, layers, batch_first=True, bidirectional=True, dropout=dropout)
        self.head = nn.Sequential(nn.Linear(2 * hidden, hidden), nn.GELU(), nn.Linear(hidden, 1))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        h, _ = self.lstm(self.inp(x))
        return self.head(h).squeeze(-1)
