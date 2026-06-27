from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.klaviyo import router as klaviyo_router

app = FastAPI(title="Martech Integration Builder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # demo only — not for production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(klaviyo_router, prefix="/demo")


@app.get("/health")
def health():
    return {"status": "ok"}
