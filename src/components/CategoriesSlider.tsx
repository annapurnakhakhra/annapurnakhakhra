import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productService } from "../services/products";

export interface Collection {
  id?: string;
  title?: string;
  handle?: string;
  image?: {
    url?: string;
    altText?: string;
  };
}

const FALLBACK_COLLECTIONS: Collection[] = [
  {
    id: "col-1",
    title: "Khakhra Snack - Pure Ghee",
    handle: "pure-ghee",
    image: { url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80" },
  },
  {
    id: "col-2",
    title: "Khakhra Snack - Oil",
    handle: "oil",
    image: { url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=80" },
  },
  {
    id: "col-3",
    title: "Biscuit Bhakhri Khakhara - Oil",
    handle: "biscuit-bhakhri-khakhara-oil",
    image: { url: "https://images.unsplash.com/photo-1541518763669-27fef04b14da?auto=format&fit=crop&w=400&q=80" },
  },
  {
    id: "col-4",
    title: "Farali - Upwas - Falahari Khakhara",
    handle: "farali-khakhra-pure-fasting-snacks",
    image: { url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80" },
  },
  {
    id: "col-5",
    title: "Sugar Free Sweets",
    handle: "sugar-free-sweets",
    image: { url: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=400&q=80" },
  },
  {
    id: "col-6",
    title: "Today's Offer",
    handle: "todays-offer",
    image: { url: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=400&q=80" },
  },
];

interface CategoriesSliderProps {
  collections?: Collection[];
}

export const CategoriesSlider: React.FC<CategoriesSliderProps> = ({ collections: propCollections }) => {
  const [collections, setCollections] = useState<Collection[]>(propCollections || []);

  useEffect(() => {
    if (!propCollections || propCollections.length === 0) {
      productService.getCollections().then((data) => {
        if (data && data.length > 0) {
          setCollections(data);
        }
      });
    } else {
      setCollections(propCollections);
    }
  }, [propCollections]);

  const allCollections = collections.length > 0 ? collections : FALLBACK_COLLECTIONS;

  const leftOrder = [
    "Khakhra Snack - Pure Ghee",
    "Khakhra Snack - Oil",
    "Biscuit Bhakhri Khakhara - Oil",
  ];

  const rightOrder = [
    "Farali - Upwas - Falahari Khakhara",
    "Sugar Free Sweets",
    "Today's Offer",
  ];

  const leftCollections = leftOrder
    .map((title) =>
      allCollections.find((c) => c.title?.trim().toLowerCase() === title.trim().toLowerCase()) ||
      FALLBACK_COLLECTIONS.find((f) => f.title?.toLowerCase() === title.toLowerCase())
    )
    .filter(Boolean) as Collection[];

  const rightCollections = rightOrder
    .map((title) =>
      allCollections.find((c) => c.title?.trim().toLowerCase() === title.trim().toLowerCase()) ||
      FALLBACK_COLLECTIONS.find((f) => f.title?.toLowerCase() === title.toLowerCase())
    )
    .filter(Boolean) as Collection[];

  // Combine for mobile layout
  const mobileCollections = [...leftCollections, ...rightCollections];

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">

        {/* 📱 MOBILE VIEW (2 columns, 3 rows) */}
        <div className="grid grid-cols-2 gap-6 lg:hidden">
          {mobileCollections.slice(0, 6).map((collection) => (
            <CategoryItem key={collection.id || collection.handle} collection={collection} />
          ))}
        </div>

        {/* 💻 DESKTOP VIEW */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_0.6fr_1fr] items-center gap-2">

          {/* LEFT SIDE */}
          <div className="grid grid-cols-3 gap-6 text-center">
            {leftCollections.map((collection) => (
              <CategoryItem key={collection.id || collection.handle} collection={collection} />
            ))}
          </div>

          {/* CENTER VIDEO */}
          <div className="flex justify-center">
            <div className="w-full rounded-2xl overflow-hidden">
              <video
                src="https://cdn.shopify.com/videos/c/o/v/1a5e212600fe49878b0c48db287b2e02.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="grid grid-cols-3 gap-6 text-center">
            {rightCollections.map((collection) => (
              <CategoryItem key={collection.id || collection.handle} collection={collection} />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

/* 🔹 Category Item */
function CategoryItem({ collection }: { collection: Collection }) {
  const imageUrl = collection.image?.url || "";
  const alt = collection.image?.altText || collection.title || "";

  return (
    <Link
      to={`/shop?collection=${collection.handle}`}
      className="group flex flex-col items-center text-center"
    >
      {/* IMAGE */}
      <div
        className="
          relative
          w-32 h-32
          sm:w-36 sm:h-36
          md:w-36 md:h-36
          rounded-lg
          overflow-hidden
          bg-gradient-to-br
          from-amber-100
          to-orange-100
          shadow-md
          group-hover:shadow-xl
          transition-all duration-300
        "
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        )}
      </div>

      {/* TITLE */}
      <h3
        className="
          mt-2
          text-xs
          md:text-sm
          font-semibold
          text-[#7d4b0e]
          group-hover:text-amber-600
          transition-colors
          line-clamp-2
          leading-tight
        "
      >
        {collection.title}
      </h3>
    </Link>
  );
}

export default CategoriesSlider;

