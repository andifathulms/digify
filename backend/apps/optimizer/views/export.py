"""POST /api/export — Tab 5 · Laporan Final."""

from apps.optimizer.features.export import laporan_final
from apps.optimizer.serializers.export import ExportSerializer
from apps.optimizer.views.base import EndpointAI


class ExportView(EndpointAI):
    serializer_class = ExportSerializer
    feature = staticmethod(laporan_final)
