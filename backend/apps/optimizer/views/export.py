"""POST /api/export — Tab 5 · Laporan Final. Tanpa AI."""

from apps.optimizer.features.export import laporan_final
from apps.optimizer.serializers.export import ExportSerializer
from apps.optimizer.views.base import EndpointAturan


class ExportView(EndpointAturan):
    serializer_class = ExportSerializer
    feature = staticmethod(laporan_final)
