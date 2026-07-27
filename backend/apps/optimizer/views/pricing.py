"""POST /api/pricing — Tab 2 · Harga Jual."""

from apps.optimizer.features.pricing import tentukan_harga
from apps.optimizer.serializers.pricing import PricingSerializer
from apps.optimizer.views.base import EndpointAI


class PricingView(EndpointAI):
    serializer_class = PricingSerializer
    feature = staticmethod(tentukan_harga)
