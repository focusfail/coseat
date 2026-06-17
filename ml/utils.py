from typing import Dict


def sanitize_dict(d: Dict) -> Dict:
    """Strip whitespace from keys and values, coercing values to str."""
    return {k.strip(): str(v).strip() for k, v in d.items()}


def get_airframe_name(info: str) -> str:
    """Extract the airframe_name value from the CSV header info line."""
    match = [v for v in info.split(",") if "airframe_name=" in v][0]
    return match.split("=")[1].strip('"')


def dict_get_float(d: dict, key: str) -> float:
    val = d.get(key, "")
    if not val or val == "" or val == "None":
        return -0.0
    return float(val)
