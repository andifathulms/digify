"""POST /api/waste-tracker — Tab 6 · Waste Tracker."""

from apps.optimizer.features.waste_tracker import lacak_waste
from apps.optimizer.serializers.waste_tracker import WasteTrackerSerializer
from apps.optimizer.views.base import EndpointAI


class WasteTrackerView(EndpointAI):
    serializer_class = WasteTrackerSerializer
    feature = staticmethod(lacak_waste)
