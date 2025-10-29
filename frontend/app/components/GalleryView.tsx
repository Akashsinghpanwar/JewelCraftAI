"use client";

interface GalleryViewProps {
  images: any[];
}

export default function GalleryView({ images }: GalleryViewProps) {
  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-amber-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Multi-Angle Views
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-amber-100 hover:border-amber-400 transition-all group"
          >
            <img
              src={img.url}
              alt={img.angle}
              className="w-full h-64 object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white font-semibold capitalize">{img.angle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
