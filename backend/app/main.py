from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.routers import ai_advisor, auth, prices, transactions, watchlist

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Live Portfolio Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(watchlist.router)
app.include_router(prices.router)
app.include_router(ai_advisor.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "Live Portfolio Tracker API"}
