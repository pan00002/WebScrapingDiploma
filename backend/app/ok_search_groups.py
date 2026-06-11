# backend/app/ok_search_groups.py
import httpx
from bs4 import BeautifulSoup
import logging
import re
from typing import List, Dict

logger = logging.getLogger(__name__)

async def search_ok_groups_by_keyword(keyword: str, limit: int = 10) -> List[Dict]:
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    search_url = f"https://ok.ru/search?st.query={keyword}&st.mode=Groups"
    groups = []
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(search_url, headers=headers)
            resp.raise_for_status()
    except Exception as e:
        logger.error(f"Ошибка поиска групп OK: {e}")
        return []

    soup = BeautifulSoup(resp.text, 'html.parser')
    # Ищем все блоки, которые могут быть карточками групп
    potential_blocks = soup.find_all('div', class_=re.compile(r'group|search-item|feed'))

    for block in potential_blocks:
        # Ищем ссылку, которая ведёт на группу
        link = block.find('a', href=re.compile(r'/group/|/club/'))
        if not link:
            continue

        href = link.get('href')
        group_url = f"https://ok.ru{href}" if href.startswith('/') else href

        # Пытаемся найти название группы
        name_elem = block.find('div', class_=re.compile(r'name|title')) or block.find('span', class_=re.compile(r'name|title'))
        group_name = name_elem.get_text(strip=True) if name_elem else link.get_text(strip=True)

        # Пытаемся найти фото группы
        photo_elem = block.find('img')
        photo_url = photo_elem.get('src') if photo_elem else ''

        groups.append({
            'id': href.split('/')[-1],
            'name': group_name,
            'url': group_url,
            'photo_url': photo_url
        })
        if len(groups) >= limit:
            break
    return groups