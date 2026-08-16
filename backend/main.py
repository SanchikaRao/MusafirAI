from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import TripRequest, FullItineraryResponse
from services import build_itinerary_logic
import traceback

app = FastAPI(title="MusafirAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "running", "endpoints": ["/api/generate-itinerary", "/docs"]}

@app.post("/api/generate-itinerary", response_model=FullItineraryResponse)
async def generate_itinerary(req: TripRequest):
    try:
        result = await build_itinerary_logic(req)
        return result
    except Exception as e:
        print("\n================= BACKEND ERROR CAUGHT =================")
        traceback.print_exc()
        print("========================================================\n")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)