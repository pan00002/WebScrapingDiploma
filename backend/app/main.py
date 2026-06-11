from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from .database import AsyncSessionLocal, init_db
from . import schemas, crud, tasks
from app.tasks import run_ok_search_task
from app.tasks import run_vk_search_by_keyword_task

app = FastAPI(title="Web Scraper API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# Эндпоинт для обычных сайтов
@app.post("/api/search", response_model=schemas.TaskResponse)
async def start_search(request: schemas.SearchRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    task = await crud.create_task(db, request.keywords, request.sites, request.config or {})
    background_tasks.add_task(tasks.run_search_task, task.id, request.keywords, request.sites, request.config or {})
    return schemas.TaskResponse(task_id=task.id, status=task.status, created_at=task.created_at)

# Эндпоинт для VK
@app.post("/api/vk_search", response_model=schemas.TaskResponse)
async def vk_search(request: schemas.SearchRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    task = await crud.create_task(db, request.keywords, request.sites, request.config or {})
    background_tasks.add_task(tasks.run_vk_search_task, task.id, request.keywords, request.sites)
    return schemas.TaskResponse(task_id=task.id, status=task.status, created_at=task.created_at)

# Эндпоинт для получения статуса задачи
@app.get("/api/task/{task_id}")
async def get_task_status(task_id: str, db: AsyncSession = Depends(get_db)):
    # 1. Получаем задачу из БД
    task = await crud.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # 2. Отладка: выводим информацию о задаче
    print(f"DEBUG [get_task_status]: task_id={task_id}, status={task.status}")

    # 3. Получаем найденные совпадения (matches)
    matches = await crud.get_matches(db, task_id)
    print(f"DEBUG [get_task_status]: найдено matches в БД = {len(matches)}")

    # 4. Формируем список результатов для ответа
    results = [
        {
            "url": m.url,
            "keyword": m.keyword,
            "context": m.context,
            "page_title": m.page_title,
            "published_at": m.published_at  # новое поле
        }
        for m in matches
    ]

    # 5. Формируем прогресс
    progress = {
        "total": task.total_sites,
        "processed": task.processed_sites,
        "found": task.found_matches,
    }

    # 6. Возвращаем ответ (если статус completed, то с результатами, иначе null)
    return schemas.ProgressResponse(
        task_id=task.id,
        status=task.status,
        progress=progress,
        results=results if task.status == "completed" else None,
        error=task.error_message,
    )

@app.post("/api/ok_search", response_model=schemas.TaskResponse)
async def ok_search(request: schemas.SearchRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    task = await crud.create_task(db, request.keywords, request.sites, request.config or {})
    background_tasks.add_task(run_ok_search_task, task.id, request.keywords, request.sites)
    return schemas.TaskResponse(task_id=task.id, status=task.status, created_at=task.created_at)

from app.tasks import run_rutube_search_task

@app.post("/api/rutube_search", response_model=schemas.TaskResponse)
async def rutube_search(request: schemas.SearchRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    task = await crud.create_task(db, request.keywords, [], request.config or {})
    background_tasks.add_task(run_rutube_search_task, task.id, request.keywords)
    return schemas.TaskResponse(task_id=task.id, status=task.status, created_at=task.created_at)

@app.post("/api/vk_search_by_keyword", response_model=schemas.TaskResponse)
async def vk_search_by_keyword(request: schemas.SearchRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    max_groups = request.config.get("max_groups", 10) if request.config else 10
    days = request.config.get("days") if request.config else None
    task = await crud.create_task(db, request.keywords, [], request.config or {}, task_type="vk_auto")
    background_tasks.add_task(tasks.run_vk_search_by_keyword_task, task.id, request.keywords, max_groups, days)
    return schemas.TaskResponse(task_id=task.id, status=task.status, created_at=task.created_at)

@app.post("/api/ok_search_by_keyword", response_model=schemas.TaskResponse)
async def ok_search_by_keyword(request: schemas.SearchRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    max_groups = request.config.get("max_groups", 10) if request.config else 10
    days = request.config.get("days") if request.config else None
    task = await crud.create_task(db, request.keywords, [], request.config or {})
    background_tasks.add_task(tasks.run_ok_search_by_keyword_task, task.id, request.keywords, max_groups)
    return schemas.TaskResponse(task_id=task.id, status=task.status, created_at=task.created_at)


@app.get("/api/stats/vk_task/{task_id}")
async def vk_task_stats(task_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func, select
    from app.database import Match
    stmt = select(Match.keyword, func.count(Match.id)).where(Match.search_id == task_id).group_by(Match.keyword)
    result = await db.execute(stmt)
    stats = [{"keyword": row[0], "count": row[1]} for row in result.all()]
    total = sum(item["count"] for item in stats)
    for item in stats:
        item["percent"] = round(item["count"] / total * 100, 1) if total else 0
    return {"total": total, "stats": stats, "task_id": task_id}