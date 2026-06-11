from googlesearch import search
import logging
from typing import List

logger = logging.getLogger(__name__)

async def search_ok_groups_via_google(keyword: str, max_results: int = 10) -> List[str]:
    """Ищет группы Одноклассников через Google."""
    query = f"site:ok.ru {keyword} группа"
    urls = []
    try:
        # Современная версия использует num_results, а не stop
        for url in search(query, num_results=max_results, lang='ru'):
            if '/group/' in url or '/club/' in url:
                urls.append(url)
        logger.info(f"Google нашёл {len(urls)} групп по запросу '{keyword}'")
    except TypeError:
        # Если num_results не поддерживается, перебираем без лимита и обрываем вручную
        try:
            for i, url in enumerate(search(query, lang='ru')):
                if '/group/' in url or '/club/' in url:
                    urls.append(url)
                    if len(urls) >= max_results:
                        break
            logger.info(f"Google (альтернативный метод) нашёл {len(urls)} групп")
        except Exception as e2:
            logger.error(f"Ошибка Google (альтернатива): {e2}")
    except Exception as e:
        logger.error(f"Ошибка поиска Google: {e}")
    return urls