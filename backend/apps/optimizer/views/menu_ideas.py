"""POST /api/menu-ideas — Tab 7 · AI Menu Ideas."""

from apps.optimizer.features.menu_ideas import ide_menu
from apps.optimizer.serializers.menu_ideas import MenuIdeasSerializer
from apps.optimizer.views.base import EndpointAI


class MenuIdeasView(EndpointAI):
    serializer_class = MenuIdeasSerializer
    feature = staticmethod(ide_menu)
