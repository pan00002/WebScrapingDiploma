# backend/app/vk_post_parser.py
import logging
from app import crud
from app.vk_client import get_all_posts
from app.scraper import find_context_in_text

logger = logging.getLogger(__name__)

# Постоянная ссылка на логотип VK (можно заменить на любую картинку)
VK_LOGO = "https://img.freepik.com/premium-vector/social-media-logo_1305298-30571.jpg?semt=ais_hybrid&w=740&q=80"

async def parse_vk_group_and_save(db, vk, owner_id: int, group_identifier: str, keywords: list, task_id: str):
    posts = get_all_posts(vk, owner_id, limit=100)
    matches = []
    for post in posts:
        text = post.get('text', '')
        if not text:
            continue
        for kw in keywords:
            if kw.lower() in text.lower():
                contexts = find_context_in_text(text, kw, window=200)
                for ctx in contexts:
                    matches.append({
                        "url": f"https://vk.com/wall{owner_id}_{post['id']}",
                        "keyword": kw,
                        "context": ctx,
                        "page_title": f"Пост из {group_identifier}",
                        "group_photo": VK_LOGO   # заглушка
                    })
    if matches:
        await crud.add_matches(db, task_id, matches)
    return len(matches)