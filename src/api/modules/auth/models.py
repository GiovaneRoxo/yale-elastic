from sqlalchemy import Column, Integer, String, Boolean
from api.infra.sqlite import Base # Garanta que importa o Base da infra

class UserTable(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    empresa = Column(String, nullable=True)
    is_vendedor = Column(Boolean, default=True)