from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from .database import SearchTask, Match
import datetime
from typing import List, Dict

async def create_task(db: AsyncSession, keywords: List[str], sites: List[str], config: dict, task_type: str = "web") -> SearchTask:
    task = SearchTask(
        keywords=keywords,
        sites=sites,
        config=config,
        status="pending",
        total_sites=len(sites),
        processed_sites=0,
        found_matches=0,
        task_type=task_type
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task

async def update_task_status(db: AsyncSession, task_id: str, status: str, error_message: str = None):
    values = {"status": status}
    if status in ("completed", "failed"):
        values["completed_at"] = datetime.datetime.utcnow()
    if error_message:
        values["error_message"] = error_message
    stmt = update(SearchTask).where(SearchTask.id == task_id).values(**values)
    await db.execute(stmt)
    await db.commit()

async def update_task_progress(db: AsyncSession, task_id: str, processed_sites: int, found_matches: int):
    stmt = update(SearchTask).where(SearchTask.id == task_id).values(
        processed_sites=processed_sites,
        found_matches=found_matches
    )
    await db.execute(stmt)
    await db.commit()

async def add_matches(db: AsyncSession, task_id: str, matches: List[Dict]):
    for m in matches:
        match = Match(
            search_id=task_id,
            url=m["url"],
            keyword=m["keyword"],
            context=m["context"],
            page_title=m.get("page_title"),
            published_at=m.get("published_at")
        )
        db.add(match)
    await db.commit()

async def get_task(db: AsyncSession, task_id: str):
    result = await db.execute(select(SearchTask).where(SearchTask.id == task_id))
    return result.scalar_one_or_none()

async def get_matches(db: AsyncSession, task_id: str):
    result = await db.execute(select(Match).where(Match.search_id == task_id))
    return result.scalars().all()