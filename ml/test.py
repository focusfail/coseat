import torch
import torch.nn as nn
from models import FlightData, Path


# --- 1. Convert EngineData to a tensor ---
def engine_to_tensor(engine) -> torch.Tensor:
    """Stack the 6 feature series → (time_steps, 6)"""
    features = [
        engine.power,
        engine.rpm,
        engine.fuel_flow,
        engine.fuel_pressure,
        engine.oil_pressure,
        engine.oil_temperature,
    ]
    return torch.tensor(features, dtype=torch.float32).T  # (T, 6)


# --- 2. A minimal LSTM wrapper ---
class EngineLSTM(nn.Module):
    def __init__(self, input_size=6, hidden_size=64, num_layers=2, output_size=1):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.head = nn.Linear(hidden_size, output_size)

    def forward(self, x):  # x: (batch, T, 6)
        out, _ = self.lstm(x)  # out: (batch, T, hidden)
        return self.head(out)  # (batch, T, output_size)


# --- 3. Feed a single flight in ---
fd = FlightData.read_csv(Path("../test.csv"))

x = engine_to_tensor(fd.engine_0)  # (T, 6)
x = x.unsqueeze(0)  # (1, T, 6)  — batch of 1

model = EngineLSTM()
pred = model(x)  # (1, T, 1)
