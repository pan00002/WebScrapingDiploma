import vk_api
import time
import logging
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv()
# ⚠️ ВСТАВЬТЕ ВАШ ТОКЕН VK (полученный через https://oauth.vk.com/blank.html...)
VK_TOKEN = VK_TOKEN = os.getenv("VK_TOKEN")

def get_group_id(vk, screen_name: str) -> Optional[int]:
    try:
        resolved = vk.utils.resolveScreenName(screen_name=screen_name)
        # Правильный ответ: {'type': 'group', 'object_id': 172062898}
        if resolved and resolved.get('type') == 'group':
            return -resolved['object_id']   # <-- было 'owner_id', исправлено на 'object_id'
        else:
            logger.warning(f"Группа не найдена: {screen_name}")
            return None
    except Exception as e:
        logger.error(f"Ошибка resolveScreenName для {screen_name}: {e}")
        return None

def get_all_posts(vk, owner_id: int, limit: int = 100) -> List[Dict]:
    """Возвращает последние limit постов из сообщества (без фильтрации)"""
    all_posts = []
    offset = 0
    count = min(100, limit)
    while len(all_posts) < limit:
        try:
            response = vk.wall.get(owner_id=owner_id, count=count, offset=offset)
            posts = response.get('items', [])
            if not posts:
                break
            all_posts.extend(posts)
            offset += count
            time.sleep(0.34)
            if len(posts) < count:
                break
        except vk_api.exceptions.ApiError as e:
            logger.error(f"VK API ошибка wall.get {owner_id}: {e}")
            break
    return all_posts[:limit]

async def get_group_photo_by_id(vk, owner_id: int) -> str:
    """Получает URL аватарки сообщества по его owner_id (отрицательному)."""
    try:
        group_id = abs(owner_id)
        response = vk.groups.getById(group_id=group_id, fields='photo_100', v='5.199')
        if response and len(response) > 0:
            return response[0].get('photo_100', '')
    except Exception as e:
        print(f"Ошибка получения фото группы {owner_id}: {e}")
    return ""