from sqlalchemy import Column, Integer, String, Boolean
from backend.infra.sqlite import Base # Garanta que importa o Base da infra

class UserTable(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    company = Column(String, nullable=True)
    is_seller = Column(Boolean, default=True)