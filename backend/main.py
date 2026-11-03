from fastapi import FastAPI, File, HTTPException, UploadFile
from ml.models import FlightData
from tempfile import TemporaryFile
import sqlite3
import os
from pathlib import Path
import datetime as dt
import json

app = FastAPI()
con = sqlite3.connect("coseat.db")
con.row_factory = sqlite3.Row
cur = con.cursor()
cur.execute("CREATE TABLE IF NOT EXISTS flights(id INTEGER PRIMARY KEY, startDate DATE NOT NULL, endDate DATE NOT NULL, airplane TEXT NOT NULL, csv TEXT NOT NULL)")

@app.post("/api/csv")
async def create_upload_file(file: UploadFile):
    try:
        print("bro printe doch was ich crash out")
        jsonified: FlightData
        with open(file.filename, "wb") as f:
            content = await file.read()
            f.write(content)
        mldata = FlightData.read(Path("./" + file.filename))
        os.makedirs("./flights", exist_ok=True)
        filepath = "./flights/" + file.filename[:-4] + ".json"
        with open(filepath, "w") as f:
            json.dump(mldata.dict(), f)

        print(mldata)
        mljson = mldata.dict()
        date = dt.datetime.now()
        data = [
            date.strptime(mljson.get("timestamps")[0], "%Y-%m-%d %H:%M:%S"),
            date.strptime(mljson.get("timestamps")[-1], "%Y-%m-%d %H:%M:%S"),
            mljson.get("airframe_name"),
            filepath,
        ]
        print(data)
        cur.execute("INSERT INTO flights (startDate, endDate, airplane, csv) VALUES (?, ?, ?, ?)", data)
        con.commit()
        return {"result": mldata}
    except Exception as e:
        print(f"Error {e}")
        return {"error": "cooked: "}

@app.get("/api/flightList")
async def get_flight_list():
    res = cur.execute("SELECT id, startDate, endDate, airplane, csv from flights")
    return res.fetchall()

@app.get("/api/flight")
async def get_flight(id: int = 0):
    res = cur.execute("SELECT * from flights WHERE id = (?)", (id,))
    data = res.fetchone()
    try:
        with open(data['csv']) as f:
            s = f.read()
            return {
                "id": data['id'],
                "startDate": data['startDate'],
                "endDate": data['endDate'],
                "airplane": data['airplane'], 
                "fileName": Path(data['csv']).stem,
                "json": s,
            }
        if data is None:
            raise HTTPException(status_code=404, detail="Flight not found")
    except IOError as e:
        return {
            "id": data['id'],
            "startDate": data['startDate'],
            "endDate": data['endDate'],
            "airplane": data['airplane'], 
            "error": True,
            "message": "Could not read file",
            "fileName": Path(data['csv']).stem,
            "friendlyMessage": "Konnte die Flugdatei nicht finden. Das Problem lässt sich vermutlich durch ein neues Hochladen lösen."
        }

@app.delete("/api/flight")
async def delete_flight(id: int = 0):
    res = cur.execute("SELECT csv FROM flights WHERE id = (?)", (id,))
    data = res.fetchone()
    if data is None:
        raise HTTPException(status_code=404, detail="Flight not found")

    cur.execute("DELETE FROM flights WHERE id = (?)", (id,))
    con.commit()

    try:
        os.remove(data["csv"])
    except FileNotFoundError:
        pass

    return {"result": "Flight deleted"}
