import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

_model = None
_tokenizer = None

def _load_model():
    global _model, _tokenizer
    if _model is None:
        model_name = "cointegrated/rubert-tiny-sentiment-balanced"
        _tokenizer = AutoTokenizer.from_pretrained(model_name)
        _model = AutoModelForSequenceClassification.from_pretrained(model_name)
        if torch.cuda.is_available():
            _model.cuda()
        _model.eval()
        print("[INFO] Модель анализа тональности загружена")

def analyze_sentiment(text: str) -> str:
    """Возвращает 'positive', 'negative' или 'neutral'."""
    if not text or len(text.strip()) < 5:
        return 'neutral'
    _load_model()
    with torch.no_grad():
        inputs = _tokenizer(text, return_tensors='pt', truncation=True, padding=True)
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
        outputs = _model(**inputs)
        probs = torch.sigmoid(outputs.logits).cpu().numpy()[0]
        labels = ['negative', 'neutral', 'positive']
        return labels[probs.argmax()]