from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.schemas import TransactionCreate, TransactionOut, TransactionUpdate

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=List[TransactionOut])
def list_transactions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Transaction).filter(Transaction.user_id == user.id).order_by(Transaction.date.desc()).all()


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(
    payload: TransactionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    qty = payload.quantity if payload.quantity is not None else (payload.shares if payload.shares is not None else 1.0)
    tx = Transaction(
        user_id=user.id,
        ticker=payload.ticker,
        type=payload.type,
        quantity=float(qty),
        price=float(payload.price),
        date=payload.date or date.today()
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.put("/{tx_id}", response_model=TransactionOut)
def update_transaction(
    tx_id: int,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    for field, value in payload.model_dump().items():
        if hasattr(tx, field) and value is not None:
            setattr(tx, field, value)
    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/{tx_id}", status_code=204)
def delete_transaction(tx_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(tx)
    db.commit()
