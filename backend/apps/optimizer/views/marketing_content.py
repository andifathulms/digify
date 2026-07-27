"""POST /api/marketing-content — Tab 8 · Konten Promosi."""

from apps.optimizer.features.marketing_content import konten_promosi
from apps.optimizer.serializers.marketing_content import MarketingContentSerializer
from apps.optimizer.views.base import EndpointAI


class MarketingContentView(EndpointAI):
    serializer_class = MarketingContentSerializer
    feature = staticmethod(konten_promosi)
