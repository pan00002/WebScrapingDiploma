import asyncio
from urllib.parse import urljoin, urlparse
from collections import deque
from bs4 import BeautifulSoup
from app.scraper import fetch_page_text_httpx, find_context_in_text


async def crawl_and_search(start_urls, keywords, max_depth=2, max_pages=50, window=150):
    """
    Рекурсивный обход ссылок (поиск в глубину) в пределах домена стартового URL.
    Возвращает список совпадений с ключевыми словами.
    """
    if not start_urls:
        return []

    # Определяем домен для ограничения (по первому URL)
    domain = urlparse(start_urls[0]).netloc
    visited = set()
    to_visit = deque([(url, 0) for url in start_urls])
    all_matches = []

    while to_visit and len(visited) < max_pages:
        url, depth = to_visit.popleft()
        if url in visited or depth > max_depth:
            continue
        visited.add(url)

        # Скачиваем страницу
        html = await fetch_page_text_httpx(url)
        if not html:
            continue

        # Ищем ключевые слова
        soup = BeautifulSoup(html, 'html.parser')
        text = soup.get_text(separator=' ', strip=True)
        for kw in keywords:
            if kw.lower() in text.lower():
                contexts = find_context_in_text(text, kw, window)
                for ctx in contexts:
                    all_matches.append({
                        "url": url,
                        "keyword": kw,
                        "context": ctx,
                        "page_title": soup.title.string if soup.title else "",
                        "published_at": None,
                        "source": "crawler"
                    })

        # Если глубина позволяет, извлекаем ссылки для дальнейшего обхода
        if depth < max_depth:
            for link in soup.find_all('a', href=True):
                href = urljoin(url, link['href'])
                # Пропускаем якоря, javascript, файлы и внешние домены
                if href.startswith('#') or href.startswith('javascript:') or href.startswith('mailto:'):
                    continue
                # Ограничиваемся тем же доменом (можно убрать, если нужен весь интернет)
                link_domain = urlparse(href).netloc
                if link_domain == domain and href not in visited:
                    to_visit.append((href, depth + 1))

            # Небольшая задержка, чтобы не перегружать сервер
            await asyncio.sleep(0.5)

    return all_matches