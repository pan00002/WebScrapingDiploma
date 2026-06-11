# backend/app/vk_search_groups.py (обновлённая версия)
import vk_api
import logging
import os
from dotenv import load_dotenv
from typing import List, Dict
load_dotenv()
logger = logging.getLogger(__name__)

VK_TOKEN = VK_TOKEN = os.getenv("VK_TOKEN")

def search_communities_by_keyword(keyword: str, count: int = 20) -> List[Dict]:
    vk_session = vk_api.VkApi(token=VK_TOKEN)
    vk = vk_session.get_api()
    try:
        response = vk.groups.search(q=keyword, type='group', count=count, v='5.199')
        communities = []
        for group in response['items']:
            screen_name = group.get('screen_name')
            if screen_name:
                communities.append({
                    'id': group['id'],
                    'screen_name': screen_name,
                    'name': group['name'],
                    'members': group.get('members_count', 0),
                    'photo_url': group.get('photo_100', '')  # 100x100 пикселей
                })
        return communities
    except vk_api.exceptions.ApiError as e:
        logger.error(f"Ошибка VK API при поиске групп: {e}")
        return []