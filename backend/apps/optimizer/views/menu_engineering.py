"""POST /api/menu-engineering — Tab 4 · Optimasi Menu."""

from apps.optimizer.features.menu_engineering import optimasi_menu
from apps.optimizer.serializers.menu_engineering import MenuEngineeringSerializer
from apps.optimizer.views.base import EndpointAI


class MenuEngineeringView(EndpointAI):
    serializer_class = MenuEngineeringSerializer
    feature = staticmethod(optimasi_menu)
