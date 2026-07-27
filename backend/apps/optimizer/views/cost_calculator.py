"""POST /api/cost-calculator — Tab 1 · Biaya Menu. Tanpa AI."""

from apps.optimizer.features.cost_calculator import hitung_biaya_menu
from apps.optimizer.serializers.cost_calculator import CostCalculatorSerializer
from apps.optimizer.views.base import EndpointAturan


class CostCalculatorView(EndpointAturan):
    serializer_class = CostCalculatorSerializer
    feature = staticmethod(hitung_biaya_menu)
