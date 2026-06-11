from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, String, Integer, Text, DateTime, JSON
import datetime
import uuid

SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./scraper.db"

engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

class SearchTask(Base):
    __tablename__ = "search_tasks"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    keywords = Column(JSON)
    sites = Column(JSON)
    config = Column(JSON, nullable=True)
    status = Column(String, default="pending")
    total_sites = Column(Integer, default=0)
    processed_sites = Column(Integer, default=0)
    found_matches = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    task_type = Column(String, nullable=True, default="web")   # для идентификации типа задачи

class Match(Base):
    __tablename__ = "matches"
    id = Column(Integer, primary_key=True, autoincrement=True)
    search_id = Column(String, index=True)
    url = Column(String)
    keyword = Column(String)
    context = Column(Text)
    page_title = Column(String, nullable=True)
    published_at = Column(String, nullable=True)   # дата публикации поста
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)