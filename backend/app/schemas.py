from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class SearchRequest(BaseModel):
    keywords: List[str]
    sites: List[str]
    config: Optional[Dict] = None

class TaskResponse(BaseModel):
    task_id: str
    status: str
    created_at: datetime

class ProgressResponse(BaseModel):
    task_id: str
    status: str
    progress: Dict
    results: Optional[List[Dict]] = None
    error: Optional[str] = None