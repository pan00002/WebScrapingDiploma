import httpx
from bs4 import BeautifulSoup
import re
from typing import List, Optional



async def fetch_page_text(url: str, timeout: int = 10) -> Optional[str]:
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, 'html.parser')
            for script in soup(["script", "style"]):
                script.decompose()
            text = soup.get_text(separator=' ', strip=True)
            text = re.sub(r'\s+', ' ', text)
            return text
    except Exception as e:
        print(f"HTTPX ошибка {url}: {e}")
        return None

def find_context(text: str, keyword: str, window: int = 150) -> List[str]:
    contexts = []
    keyword_lower = keyword.lower()
    text_lower = text.lower()
    start = 0
    while True:
        pos = text_lower.find(keyword_lower, start)
        if pos == -1:
            break
        left = max(0, pos - window)
        right = min(len(text), pos + len(keyword) + window)
        context = text[left:right].strip()
        contexts.append(f"...{context}...")
        start = pos + len(keyword)
    return contexts

async def scrape_site(url: str, keywords: List[str], window: int) -> List[dict]:
    html = await fetch_page_text(url)
    if not html:
        return []
    soup = BeautifulSoup(html, 'html.parser')
    title = soup.find('title')
    page_title = title.get_text(strip=True) if title else ""
    results = []
    for kw in keywords:
        for ctx in find_context(html, kw, window):
            results.append({
                "url": url,
                "keyword": kw,
                "context": ctx,
                "page_title": page_title
            })
    return results