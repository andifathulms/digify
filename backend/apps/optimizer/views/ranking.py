"""POST /api/ranking — Tab 3 · Ranking Profitabilitas. Tanpa AI."""

from apps.optimizer.features.ranking import ranking_profitabilitas
from apps.optimizer.serializers.ranking import RankingSerializer
from apps.optimizer.views.base import EndpointAturan


class RankingView(EndpointAturan):
    serializer_class = RankingSerializer
    feature = staticmethod(ranking_profitabilitas)
