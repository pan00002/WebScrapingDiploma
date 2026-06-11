# test_vk_api.py
import vk_api
import os
from dotenv import load_dotenv
load_dotenv()
VK_TOKEN = os.getenv("VK_TOKEN")
vk_session = vk_api.VkApi(token=VK_TOKEN)
vk = vk_session.get_api()

# Проверяем, можем ли получить информацию о сообществе
try:
    group = vk.groups.getById(group_id="izvmor")
    print("Группа найдена:", group)
except Exception as e:
    print("Ошибка при получении группы:", e)

# Пробуем wall.search
try:
    result = vk.wall.search(owner_id=-172062898, query="Мордовия", count=5)  # owner_id замените на реальный
    print("Результатов поиска:", len(result['items']))
    for post in result['items']:
        print(post['text'][:200])
except Exception as e:
    print("Ошибка wall.search:", e)