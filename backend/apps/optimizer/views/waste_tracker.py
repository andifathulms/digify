"""POST /api/waste-tracker — Tab 6 · Waste Tracker. Tanpa AI."""

from apps.optimizer.features.waste_tracker import lacak_waste
from apps.optimizer.serializers.waste_tracker import WasteTrackerSerializer
from apps.optimizer.views.base import EndpointAturan


class WasteTrackerView(EndpointAturan):
    serializer_class = WasteTrackerSerializer
    feature = staticmethod(lacak_waste)
