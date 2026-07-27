import CarouselGambar from "@/components/tools/CarouselGambar";
import JudulTab from "@/components/ui/JudulTab";

export const metadata = { title: "Carousel Gambar — Digify Laris" };

export default function CarouselGambarPage() {
  return (
    <>
      <JudulTab slug="carousel-gambar" />
      <CarouselGambar />
    </>
  );
}
