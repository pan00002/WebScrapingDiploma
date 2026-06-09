import vk_api
import time
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

# ⚠️ ВСТАВЬТЕ ВАШ ТОКЕН VK (полученный через https://oauth.vk.com/blank.html...)
VK_TOKEN = "vk1.a.MN-DOK33PdExzMQ9IAYcGD9H6pID2MYNtLQFJuzuHWgyGaMOgKCKAVdi1FbSh6eJuDxxJafoyh_Fghzyvxe5NUsi1P-VFm22dzTwCpiVMfZJCXzO-WgObHuF9bl6KVgZih5OfTXvVCa2e_YzLSm9Eg58A8Lq7JYFhd7zOy7zFikijsmuwXRzmunZOkB7K2gNKZUXCQ2lHgEN31B0IqsMCA"

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