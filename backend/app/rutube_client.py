import asyncio
import logging
from typing import List, Dict
from playwright.sync_api import sync_playwright

logger = logging.getLogger(__name__)


def search_rutube_sync(keyword: str, max_results: int = 10) -> List[Dict]:
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        search_url = f"https://rutube.ru/search/?q={keyword}"
        try:
            page.goto(search_url, timeout=60000)
            # Ждём загрузки сети (не ждём конкретного селектора)
            page.wait_for_load_state("networkidle", timeout=10000)
        except Exception as e:
            logger.error(f"Ошибка загрузки: {e}")
            browser.close()
            return []

        # Сохраняем HTML для анализа
        html_path = f"rutube_debug_{keyword}.html"
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(page.content())
        logger.info(f"HTML сохранён в {html_path}")

        # Прокручиваем для подгрузки
        for _ in range(2):
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(2000)

        # Собираем все ссылки, ведущие на /video/ или /live/video/
        links = page.query_selector_all("a[href*='/video/'], a[href*='/live/video/']")
        logger.info(f"Найдено ссылок на видео: {len(links)}")

        for link in links[:max_results]:
            href = link.get_attribute("href")
            if not href:
                continue
            # Формируем полный URL
            if href.startswith('/'):
                video_url = f"https://rutube.ru{href}"
            else:
                video_url = href

            # Пытаемся получить название видео из нескольких источников
            title = link.get_attribute("title")
            if not title:
                # Ищем дочерние элементы с текстом
                title_elem = link.query_selector("h3, .video-card__title, .video_item_title, .card-title, .title")
                if title_elem:
                    title = title_elem.inner_text()
                else:
                    title = link.inner_text()
            title = title.strip() if title else "Без названия"

            results.append({"title": title, "url": video_url})

        browser.close()
    return results


async def search_rutube_videos(keyword: str, limit: int = 10) -> List[Dict]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, search_rutube_sync, keyword, limit)