import CarouselTeks from "@/components/tools/CarouselTeks";
import JudulTab from "@/components/ui/JudulTab";

export const metadata = { title: "Carousel Teks — Digify Laris" };

export default function CarouselTeksPage() {
  return (
    <>
      <JudulTab slug="carousel-teks" />
      <CarouselTeks />
    </>
  );
}
