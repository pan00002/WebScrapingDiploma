# backend/app/vk_post_parser.py
import time
import logging
from datetime import datetime
from app import crud
from app.vk_client import get_all_posts
from app.scraper import find_context_in_text
from app.sentiment_analyzer import analyze_sentiment

logger = logging.getLogger(__name__)

async def parse_vk_group_and_save(db, vk, owner_id: int, group_identifier: str, keywords: list, task_id: str, days: int = None):
    """
    Парсит посты из группы VK, фильтрует по дате (если задано days),
    ищет ключевые слова, анализирует тональность, сохраняет в БД.
    """
    # Получаем реальное название группы через API
    group_name = group_identifier  # fallback
    try:
        group_info = vk.groups.getById(group_id=abs(owner_id), fields='name')
        if group_info and len(group_info) > 0:
            group_name = group_info[0].get('name', group_identifier)
    except Exception as e:
        logger.error(f"Ошибка получения названия группы {owner_id}: {e}")

    posts = get_all_posts(vk, owner_id, limit=100)
    current_time = time.time()
    min_date = current_time - (days * 86400) if days else 0
    matches = []

    for post in posts:
        post_date = post.get('date', 0)
        if min_date and post_date < min_date:
            continue
        text = post.get('text', '')
        if not text:
            continue

        # Поиск ключевых слов в тексте поста
        for kw in keywords:
            if kw.lower() in text.lower():
                contexts = find_context_in_text(text, kw, window=200)
                if not contexts:
                    continue
                # Анализируем тональность всего поста (один раз на пост, а не на каждый контекст)
                sentiment = analyze_sentiment(text)
                published_at = datetime.fromtimestamp(post_date).strftime('%Y-%m-%d %H:%M:%S')
                for ctx in contexts:
                    matches.append({
                        "url": f"https://vk.com/wall{owner_id}_{post['id']}",
                        "keyword": kw,
                        "context": ctx,
                        "page_title": group_name,
                        "published_at": published_at,
                        "sentiment": sentiment,
                        "source": "vk"
                    })
                # Примечание: если одно ключевое слово найдено, продолжаем проверять остальные kw
                # для этого же поста — это правильно.

    if matches:
        await crud.add_matches(db, task_id, matches)
    return len(matches)