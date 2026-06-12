# backend/app/rss_client.py
import feedparser
import logging
from typing import List, Dict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Список RSS-источников (можно расширять)
RSS_FEEDS = {
    "yandex": "https://news.yandex.ru/index.rss",
    "lenta": "https://lenta.ru/rss",
    "ria": "https://ria.ru/export/rss2/index.xml",
    "tass": "https://tass.ru/rss/v2.xml",
    "mk": "https://www.mk.ru/rss/news/index.xml",
    # Добавьте свои источники:
    # "vedomosti": "https://www.vedomosti.ru/rss/rubric/news",
}

async def search_rss(keywords: List[str], days: int = None, max_articles_per_feed: int = 30) -> List[Dict]:
    """
    Парсит RSS-ленты, ищет статьи с ключевыми словами в заголовке или описании.
    Возвращает список совпадений с полем source = "rss".
    """
    results = []
    cutoff_date = None
    if days:
        cutoff_date = datetime.now() - timedelta(days=days)

    for source_name, feed_url in RSS_FEEDS.items():
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries[:max_articles_per_feed]:
                title = entry.get('title', '')
                description = entry.get('description', '')
                link = entry.get('link', '')
                published = entry.get('published_parsed')
                if published:
                    pub_date = datetime(*published[:6])
                else:
                    pub_date = None

                if cutoff_date and pub_date and pub_date < cutoff_date:
                    continue

                full_text = f"{title} {description}".lower()
                for kw in keywords:
                    if kw.lower() in full_text:
                        context = (description[:500] + '...') if len(description) > 500 else description
                        if not context:
                            context = title
                        results.append({
                            "url": link,
                            "keyword": kw,
                            "context": context,
                            "page_title": title,
                            "group_photo": None,
                            "published_at": pub_date.strftime('%Y-%m-%d %H:%M:%S') if pub_date else None,
                            "sentiment": "neutral",      # или можно добавить анализ тональности позже
                            "source": "rss"              # <--- поле источника
                        })
        except Exception as e:
            logger.error(f"Ошибка парсинга RSS {source_name}: {e}")
    return results