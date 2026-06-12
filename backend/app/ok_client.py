import httpx
from bs4 import BeautifulSoup
import re
import dateparser
from datetime import datetime, timedelta
from typing import List, Dict

async def scrape_ok_group(url: str, keywords: List[str], days: int = None, window: int = 150) -> List[Dict]:
    """
    Парсит группу Одноклассников по URL.
    Ищет ключевые слова в тексте постов, фильтрует по дате (если days указан).
    """
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
    except Exception as e:
        print(f"Ошибка загрузки {url}: {e}")
        return []

    soup = BeautifulSoup(resp.text, 'html.parser')
    title_tag = soup.find('title')
    page_title = title_tag.get_text(strip=True) if title_tag else url

    # Ищем блоки постов (обновлённые селекторы)
    post_blocks = soup.find_all('div', class_='feed-w') or \
                  soup.find_all('div', class_='widget-w') or \
                  soup.find_all('div', attrs={'data-ts': True})

    now = datetime.now()
    cutoff_date = now - timedelta(days=days) if days else None

    results = []
    for block in post_blocks:
        # Текст поста
        text_elem = (block.find('div', class_='media-text_cnt_tx') or
                     block.find('div', class_='feed-text') or
                     block.find('div', class_='js-media-text'))
        if not text_elem:
            continue
        post_text = text_elem.get_text(separator=' ', strip=True)
        if not post_text:
            continue

        # Дата поста
        date_elem = block.find('span', class_='date') or block.find('span', attrs={'data-date': True})
        if date_elem:
            date_str = date_elem.get('data-date') or date_elem.get_text(strip=True)
            post_date = dateparser.parse(date_str, languages=['ru'])
        else:
            # Пробуем найти time
            time_elem = block.find('time')
            if time_elem:
                date_str = time_elem.get('datetime') or time_elem.get_text(strip=True)
                post_date = dateparser.parse(date_str, languages=['ru'])
            else:
                post_date = None

        if cutoff_date:
            if post_date and post_date < cutoff_date:
                continue
            elif not post_date:
                # Если дату не удалось определить, пропускаем (или можно включить – на выбор)
                continue

        # Поиск ключевых слов
        for kw in keywords:
            if kw.lower() in post_text.lower():
                contexts = _find_context(post_text, kw, window)
                for ctx in contexts:
                    results.append({
                        "url": url,
                        "keyword": kw,
                        "context": ctx,
                        "page_title": page_title,
                        "group_photo": None,
                        "published_at": post_date.strftime('%Y-%m-%d %H:%M:%S') if post_date else None,
                        "source": "ok"
                    })
    return results

def _find_context(text: str, keyword: str, window: int) -> List[str]:
    contexts = []
    kw_low = keyword.lower()
    txt_low = text.lower()
    start = 0
    while True:
        pos = txt_low.find(kw_low, start)
        if pos == -1:
            break
        left = max(0, pos - window)
        right = min(len(text), pos + len(keyword) + window)
        context = text[left:right].strip()
        contexts.append(f"...{context}...")
        start = pos + len(keyword)
    return contexts