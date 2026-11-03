from pathlib import Path

from . import FlightData

TEST_FILE = "./test_flights/x_plane_12_unsan.txt"

fd = FlightData.read_xplane12(Path(TEST_FILE))
