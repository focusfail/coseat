from fastapi import FastAPI, File, UploadFile
from ml.models import FlightData

app = FastAPI()

@app.post("/csv")
async def create_upload_file(file: UploadFile):
    try: 
        content = file.file.read()
        with open("test.csv", "a") as f:
            f.write(content)
    except:
        print("cooked")
    finally:
        return {"filename": file.filename}