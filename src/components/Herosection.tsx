import React from "react";

export const HeroSection: React.FC = () => {
  return (
    <section className="w-full bg-[#fcfbf7] border-b border-amber-100">
      <div className="relative w-full aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/9] max-w-7xl mx-auto">
        <img
          src="https://cdn.shopify.com/s/files/1/0953/6284/2993/files/banner.png?v=1770090973"
          alt="Annapurna Khakhra Banner"
          className="w-full h-full object-contain"
        />
      </div>
    </section>
  );
};

export default HeroSection;
