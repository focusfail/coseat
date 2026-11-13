import torch
import torch.nn as nn
from models import FlightData, Path


def engine_to_tensor(engine) -> torch.Tensor:
    features = [
        engine.power,
        engine.rpm,
        engine.fuel_flow,
        engine.fuel_pressure,
        engine.oil_pressure,
        engine.oil_temperature,
    ]
    return torch.tensor(features, dtype=torch.float32).T


class EngineLSTM(nn.Module):
    def __init__(self, input_size=6, hidden_size=64, num_layers=2, output_size=1):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.head = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        out, _ = self.lstm(x)
        return self.head(out)


fd = FlightData.read_csv(Path("../test.csv"))

x = engine_to_tensor(fd.engine_0)
x = x.unsqueeze(0)

model = EngineLSTM()
pred = model(x)
