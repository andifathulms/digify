"""POST /api/menu-engineering — Tab 4 · Optimasi Menu. Tanpa AI."""

from apps.optimizer.features.menu_engineering import optimasi_menu
from apps.optimizer.serializers.menu_engineering import MenuEngineeringSerializer
from apps.optimizer.views.base import EndpointAturan


class MenuEngineeringView(EndpointAturan):
    serializer_class = MenuEngineeringSerializer
    feature = staticmethod(optimasi_menu)
