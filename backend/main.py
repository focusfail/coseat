from fastapi import FastAPI, File, UploadFile
from ml.models import FlightData
from tempfile import TemporaryFile
import sqlite3
import os

app = FastAPI()
con = sqlite3.connect("coseat.db")
cur = con.cursor()
cur.execute("CREATE TABLE IF NOT EXISTS flights(startDate DATE NOT NULL, endDate DATE NOT NULL, airplane TEXT NOT NULL, csv TEXT NOT NULL)")

@app.post("/csv")
async def create_upload_file(file: UploadFile):
    try: 
        print("bro printe doch was ich crash out")
        jsonified: FlightData
        with open(file.filename, "wb") as f:
            content = await file.read()
            f.write(content)
        mldata = FlightData.read_csv("./" + file.filename)
        os.makedirs("./flights", exist_ok=True)
        filepath = "./flights/" + file.filename[:-4] + ".json" 
        with open(filepath, "w") as f:
            f.write(str(mldata))
        
        print(mldata)
        mljson = mldata.dict()
        data = [
            mljson.get("timestamps")[0],
            mljson.get("timestamps")[-1],
            mljson.get("airframe_name"),
            filepath
        ]
        print(data)
        cur.execute("INSERT INTO flights VALUES (?, ?, ?, ?)", data)
        con.commit()
        return {"result": mldata}
    except Exception as e:
        print(f"Error {e}")
        return {"error": "cooked"}



     