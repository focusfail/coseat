from fastapi import FastAPI, File, UploadFile
from ml.models import FlightData
from tempfile import TemporaryFile

app = FastAPI()

@app.post("/csv")
async def create_upload_file(file: UploadFile):
    try: 
        content = file.file.read()
        jsonified: FlightData
        with TemporaryFile() as fp:
             fp.write(content)
             jsonified = FlightData.read_csv(fp.name) 

        with open("test.json", "w+") as f:
            f.write(jsonified.json())
    except:
        print("cooked")
    finally:
        return {"filename": file.filename}

 @app.get("/flights/test")
 async def get_flight_data():
    ...

     