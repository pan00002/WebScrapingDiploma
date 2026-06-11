# backend/app/youtube_client.py
import os
import logging
import yt_dlp
from typing import List, Dict

logger = logging.getLogger(__name__)

def search_youtube_videos(query: str, max_results: int = 10) -> List[Dict]:
    """Ищет видео через yt-dlp с возможностью прокси."""
    ydl_opts = {
        'quiet': True,
        'extract_flat': True,
        'force_generic_extractor': False,
        'ignoreerrors': True,
    }
    proxy = os.getenv("YT_PROXY")
    if proxy:
        ydl_opts['proxy'] = proxy
        logger.info(f"Используется прокси: {proxy}")
    else:
        logger.warning("Прокси не задан. YouTube может быть недоступен.")

    search_url = f"ytsearch{max_results}:{query}"
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(search_url, download=False)
            entries = info.get('entries', [])
            results = []
            for entry in entries:
                if not entry:
                    continue
                results.append({
                    'title': entry.get('title', 'Без названия'),
                    'url': entry.get('webpage_url', ''),
                    'upload_date': entry.get('upload_date', ''),
                    'description': entry.get('description', '')[:500],
                    'channel': entry.get('channel', ''),
                })
            logger.info(f"Найдено {len(results)} видео по запросу '{query}'")
            return results
    except Exception as e:
        logger.error(f"Ошибка yt-dlp: {e}")
        return []