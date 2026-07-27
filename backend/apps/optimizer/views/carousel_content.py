"""POST /api/carousel-content — Tab 9 & Tab 10.

Satu endpoint untuk dua tab. Tab 10 hanya berbeda cara merender payload yang
sama. Jangan membuat endpoint kedua (docs/API_CONTRACT.md §9).
"""

from apps.optimizer.features.carousel_content import konten_carousel
from apps.optimizer.serializers.marketing_content import CarouselContentSerializer
from apps.optimizer.views.base import EndpointAI


class CarouselContentView(EndpointAI):
    serializer_class = CarouselContentSerializer
    feature = staticmethod(konten_carousel)
