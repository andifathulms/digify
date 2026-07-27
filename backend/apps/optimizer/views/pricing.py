"""POST /api/pricing — Tab 2 · Harga Jual. Tanpa AI, tanpa potong kuota."""

from apps.optimizer.features.pricing import tentukan_harga
from apps.optimizer.serializers.pricing import PricingSerializer
from apps.optimizer.views.base import EndpointAturan


class PricingView(EndpointAturan):
    serializer_class = PricingSerializer
    feature = staticmethod(tentukan_harga)
