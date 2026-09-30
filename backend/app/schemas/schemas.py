from datetime import date as datetime_date
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# --- Auth ---------------------------------------------------------------
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class UserOut(BaseModel):
    id: int
    email: EmailStr

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- Transactions ---------------------------------------------------------
class TransactionBase(BaseModel):
    ticker: str = Field(min_length=1, max_length=20)
    type: str = "BUY"
    quantity: float = Field(gt=0)
    price: float = Field(gt=0)
    date: datetime_date = Field(default_factory=datetime_date.today)

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, v: str) -> str:
        return str(v).upper()

    @field_validator("ticker", mode="before")
    @classmethod
    def uppercase_ticker(cls, v: str) -> str:
        return str(v).strip().upper()

    @field_validator("date")
    @classmethod
    def no_future_dates(cls, v: datetime_date) -> datetime_date:
        if v > datetime_date.today():
            raise ValueError("Date cannot be in the future")
        return v


class TransactionCreate(BaseModel):
    ticker: str = Field(min_length=1, max_length=20)
    type: str = "BUY"
    shares: Optional[float] = None
    quantity: Optional[float] = None
    price: float = Field(gt=0)
    date: Optional[datetime_date] = Field(default_factory=datetime_date.today)

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, v: str) -> str:
        return str(v).upper()

    @field_validator("ticker", mode="before")
    @classmethod
    def uppercase_ticker(cls, v: str) -> str:
        return str(v).strip().upper()


class TransactionUpdate(TransactionBase):
    pass


class TransactionOut(TransactionBase):
    id: int

    class Config:
        from_attributes = True


# --- Watchlist ---------------------------------------------------------
class WatchlistCreate(BaseModel):
    ticker: str = Field(min_length=1, max_length=20)

    @field_validator("ticker", mode="before")
    @classmethod
    def uppercase_ticker(cls, v: str) -> str:
        return str(v).strip().upper()


class WatchlistOut(BaseModel):
    id: int
    ticker: str

    class Config:
        from_attributes = True
