import httpx
from bs4 import BeautifulSoup
import dateparser
from datetime import datetime, timedelta
from typing import List, Dict

async def scrape_ok_group(url: str, keywords: List[str], days: int = None, window: int = 150) -> List[Dict]:
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
    except Exception as e:
        print(f"Ошибка загрузки OK {url}: {e}")
        return []

    soup = BeautifulSoup(resp.text, 'html.parser')
    page_title = soup.find('title').get_text(strip=True) if soup.find('title') else url

    # Поиск блоков постов (универсальные классы, можно расширить)
    post_blocks = soup.find_all('div', class_='feed-w')
    if not post_blocks:
        post_blocks = soup.find_all('div', class_='media-text_cnt')
    if not post_blocks:
        post_blocks = soup.find_all('div', attrs={'data-ts': True})

    now = datetime.now()
    cutoff = now - timedelta(days=days) if days else None
    results = []

    for block in post_blocks:
        # Текст поста
        text_elem = (block.find('div', class_='media-text_cnt_tx') or
                     block.find('div', class_='feed-text') or
                     block.find('div', class_='js-media-text'))
        if not text_elem:
            continue
        text = text_elem.get_text(separator=' ', strip=True)
        if not text:
            continue

        # Дата
        date_elem = block.find('span', class_='date') or block.find('span', attrs={'data-date': True})
        post_date = None
        if date_elem:
            date_str = date_elem.get('data-date') or date_elem.get_text(strip=True)
            post_date = dateparser.parse(date_str, languages=['ru'])
        if cutoff and (post_date is None or post_date < cutoff):
            continue

        for kw in keywords:
            if kw.lower() in text.lower():
                contexts = _find_context(text, kw, window)
                for ctx in contexts:
                    results.append({
                        "url": url,
                        "keyword": kw,
                        "context": ctx,
                        "page_title": page_title,
                        "group_photo": None
                    })
    return results

def _find_context(text: str, keyword: str, window: int) -> List[str]:
    contexts, kw_low = [], keyword.lower()
    txt_low = text.lower()
    start = 0
    while True:
        pos = txt_low.find(kw_low, start)
        if pos == -1:
            break
        left = max(0, pos - window)
        right = min(len(text), pos + len(keyword) + window)
        contexts.append(f"...{text[left:right].strip()}...")
        start = pos + len(keyword)
    return contexts