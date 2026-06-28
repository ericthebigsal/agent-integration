from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.klaviyo import router as klaviyo_router
from backend.hubspot import router as hubspot_router

app = FastAPI(title="Martech Integration Builder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(klaviyo_router, prefix="/demo/klaviyo")
app.include_router(hubspot_router, prefix="/demo/hubspot")


@app.get("/health")
def health():
    return {"status": "ok"}
