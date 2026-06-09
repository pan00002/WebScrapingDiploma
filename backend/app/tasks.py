# backend/app/tasks.py
import asyncio
import logging
import vk_api
from app import crud
from app.vk_client import VK_TOKEN, get_group_id, get_all_posts
from app.scraper import scrape_site

logger = logging.getLogger(__name__)

# ========== 1. ОБЫЧНЫЙ ПОИСК ПО САЙТАМ (HTTPX / PLAYWRIGHT) ==========
async def run_search_task(task_id: str, keywords: list, sites: list, config: dict):
    """
    Фоновая задача для сканирования обычных сайтов (не VK).
    Использует scrape_site из scraper.py.
    """
    from app.database import AsyncSessionLocal  # импорт внутри функции

    async with AsyncSessionLocal() as db:
        try:
            await crud.update_task_status(db, task_id, "running")
            window = config.get("context_window", 150) if config else 150
            total = len(sites)
            processed = 0
            all_matches = []

            for url in sites:
                matches = await scrape_site(url, keywords, window)
                if matches:
                    all_matches.extend(matches)
                    await crud.add_matches(db, task_id, matches)
                processed += 1
                await crud.update_task_progress(db, task_id, processed, len(all_matches))
                await asyncio.sleep(0.5)  # вежливость к серверам

            await crud.update_task_status(db, task_id, "completed")
        except Exception as e:
            logger.exception(f"Ошибка в run_search_task для задачи {task_id}")
            await crud.update_task_status(db, task_id, "failed", str(e))

# ========== 2. ПОИСК ПО СООБЩЕСТВАМ VK (ЧЕРЕЗ API) ==========
async def run_vk_search_task(task_id: str, keywords: list, group_identifiers: list):
    """
    Фоновая задача для поиска ключевых слов в нескольких сообществах VK.
    group_identifiers: список коротких имён (например, ["izvmor", "stolica_s"]) или числовых ID.
    """
    from app.database import AsyncSessionLocal  # импорт внутри функции

    async with AsyncSessionLocal() as db:
        try:
            await crud.update_task_status(db, task_id, "running")
            logger.info(f"VK задача {task_id}: старт, групп: {len(group_identifiers)}")

            # Авторизация в VK
            vk_session = vk_api.VkApi(token=VK_TOKEN)
            vk = vk_session.get_api()

            all_matches = []
            processed = 0

            for ident in group_identifiers:
                # 1. Получаем числовой owner_id (отрицательный для сообществ)
                if str(ident).lstrip('-').isdigit():
                    owner_id = int(ident)
                else:
                    owner_id = get_group_id(vk, ident)
                if not owner_id:
                    logger.warning(f"Не удалось определить ID для {ident}, пропускаем")
                    continue

                # 2. Получаем последние посты из сообщества (до 100)
                posts = get_all_posts(vk, owner_id, limit=20)
                logger.info(f"Группа {ident} (owner_id={owner_id}): получено {len(posts)} постов")

                # 3. Ищем ключевые слова в тексте постов
                for post in posts:
                    # Пробуем получить текст из разных полей
                    text = post.get('text', '')
                    if not text and 'copy_history' in post:
                        # Если это репост, берём текст из оригинального поста
                        text = post['copy_history'][0].get('text', '')
                    if not text:
                        print("DEBUG: no text in post, skipping")
                        continue

                    print(f"DEBUG: text preview: {text[:200]}")

                    found_for_post = False
                    for kw in keywords:
                        if kw.lower() in text.lower():
                            print(f"DEBUG: found keyword '{kw}' in post {post['id']}")
                            context = text[:500] + ('...' if len(text) > 500 else '')
                            all_matches.append({
                                "url": f"https://vk.com/wall{owner_id}_{post['id']}",
                                "keyword": kw,
                                "context": context,
                                "page_title": f"Пост из {ident}"
                            })
                            found_for_post = True
                    if not found_for_post:
                        print("DEBUG: keyword not found in this post")

                processed += 1
                await crud.update_task_progress(db, task_id, processed, len(all_matches))
                await asyncio.sleep(0.34)  # соблюдаем ограничение VK: не более 3 запросов/сек

            # 4. Сохраняем все найденные совпадения
            if all_matches:
                await crud.add_matches(db, task_id, all_matches)
                print(f"DEBUG: added {len(all_matches)} matches to DB")
                logger.info(f"VK задача {task_id}: найдено {len(all_matches)} совпадений")
            else:
                logger.info(f"VK задача {task_id}: совпадений не найдено")

            print(f"DEBUG: marking task {task_id} as completed")
            await crud.update_task_status(db, task_id, "completed")

        except Exception as e:
            logger.exception(f"Ошибка в run_vk_search_task для задачи {task_id}")
            await crud.update_task_status(db, task_id, "failed", str(e))