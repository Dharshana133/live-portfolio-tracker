from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ticker = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False)  # "buy" | "sell"
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    date = Column(Date, nullable=False)

    owner = relationship("User", back_populates="transactions")


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ticker = Column(String, nullable=False, index=True)

    owner = relationship("User", back_populates="watchlist_items")
