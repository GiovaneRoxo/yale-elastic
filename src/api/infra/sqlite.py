from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Column, Integer, String, Boolean

# O arquivo .db será criado na pasta api/
SQLALCHEMY_DATABASE_URL = "sqlite:///./api/db/usuarios.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UserTable(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    empresa = Column(String, nullable=True)
    is_vendedor = Column(Boolean, default=True)

# Cria as tabelas automaticamente
Base.metadata.create_all(bind=engine)

# Dependência para as rotas usarem o banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()