import React, { useEffect } from 'react';
import { Wheat, Heart, Sparkles, Users, CheckCircle, Clock, Award } from 'lucide-react';

export const About: React.FC = () => {
  // Ensure the page always starts at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Core brand values displayed in the grid
  const values = [
    { icon: Wheat, title: "Purity First", description: "Only 100% whole wheat, pure desi ghee, and freshly ground spices. No artificial preservatives, no shortcuts." },
    { icon: Heart, title: "Artisan Tradition", description: "Hand‑rolled by women artisans using grandmother Kantaba’s recipes passed down through generations." },
    { icon: Sparkles, title: "Crisp Quality", description: "Slow‑roasted on iron tawas for the signature light, airy crunch that stays fresh for months." },
    { icon: Users, title: "Women Empowerment", description: "Every pack supports skilled women from local Gujarati households, fostering sustainable livelihoods." }
  ];

  // The step‑by‑step handcrafted process
  const processSteps = [
    { icon: CheckCircle, title: "Ingredient Sourcing", subtitle: "Farm‑fresh whole wheat, pure ghee, hand‑ground spices" },
    { icon: Clock, title: "Hand Rolling", subtitle: "Small‑batch dough rolled by artisans" },
    { icon: Award, title: "Traditional Roasting", subtitle: "Low‑heat, iron‑tawa roasting for 30‑45 min" },
    { icon: Heart, title: "Quality Inspection", subtitle: "Each sheet inspected for perfect colour & texture" }
  ];

  // Impact numbers – can be animated later
  const stats = [
    { end: 5, label: "Years of Heritage", suffix: "+" },
    { end: 20, label: "Unique Flavours", suffix: "+" },
    { end: 12_000, label: "Happy Customers", suffix: "+" },
    { end: 150, label: "Women Artisans Employed", suffix: "+" }
  ];

  // Short artisan testimonials (static for now)
  const artisanStories = [
    { name: "Jigna", location: "Surat", quote: "I love turning Kantaba’s recipes into crunchy memories for families across India." },
    { name: "Meera", location: "Ahmedabad", quote: "Each sheet I roll carries a piece of my grandmother’s love." },
    { name: "Laxmi", location: "Rajkot", quote: "The pride of creating something pure and healthy for our community is priceless." }
  ];

  return (
    <div className="min-h-screen bg-[#fdfbf7] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="bg-amber-100 text-[#7d4b0e] text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full inline-block">
            Our Heritage & Story
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#7d4b0e] font-serif leading-tight">
            The Legend of Kantaba’s Kitchen
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            From a modest kitchen in Surat to thousands of homes across India, Annapurna Khakhra preserves the authentic taste of tradition in every handcrafted sheet.
          </p>
        </section>

        {/* Story Grid – the heart of the brand */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white border border-orange-100 rounded-3xl p-6 sm:p-12 shadow-sm">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-serif text-[#7d4b0e]">
              Handcrafted Gruh Udhyog Heritage
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              In Gujarati culture, food is love, care, and family heritage. Kantaba began crafting Khakhra with hand‑rolled dough and whole spices on heavy iron tawas, ensuring each sheet was thin, crispy, and nutritious.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Today, Annapurna Khakhra empowers dozens of women artisans while staying 100% faithful to Kantaba’s original recipes.
            </p>
            <div className="pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">The Kantaba Promise</h4>
              <ul className="space-y-2">
                {[
                  "Handmade in small batches",
                  "Rolled by hand, never by machines",
                  "Slow‑roasted on iron tawas for perfect crunch",
                  "Crafted by skilled women artisans",
                  "Zero preservatives, zero chemical shortcuts"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-amber-50 shadow-md">
            <img
              src="https://cdn.shopify.com/s/files/1/0953/6284/2993/files/12_f72fc31b-053b-454e-85b3-d480aa12c885.png?v=1770090988"
              alt="Annapurna Khakhra Heritage"
              className="w-full h-full object-contain p-6 hover:scale-105 transition-transform duration-500"
            />
          </div>
        </section>

        {/* Core Values Grid */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold font-serif text-[#7d4b0e] text-center">Our Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} className="bg-white border border-orange-100 rounded-3xl p-6 shadow-xs text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-[#7d4b0e] flex items-center justify-center mx-auto">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#7d4b0e]">{v.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{v.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Hand‑crafted Process */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold font-serif text-[#7d4b0e] text-center">The Hand‑crafted Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="bg-white border border-orange-100 rounded-3xl p-5 text-center shadow-xs space-y-3">
                  <div className="w-10 h-10 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#7d4b0e]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#7d4b0e]">{step.title}</h3>
                  <p className="text-xs text-slate-500">{step.subtitle}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Impact Stats – static numbers for now */}
        <section className="bg-amber-50/20 py-12 rounded-3xl">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s, i) => (
              <div key={i} className="space-y-1">
                <p className="text-2xl font-bold text-[#7d4b0e]">{s.end.toLocaleString()}{s.suffix}</p>
                <p className="text-xs text-slate-600">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Artisan Stories */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold font-serif text-[#7d4b0e] text-center">Voices from Our Artisans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {artisanStories.map((a, i) => (
              <div key={i} className="bg-white border border-orange-100 rounded-3xl p-5 shadow-xs">
                <p className="text-sm italic text-slate-700 mb-3">“{a.quote}”</p>
                <p className="text-xs font-bold text-[#7d4b0e]">— {a.name}, {a.location}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing Call‑to‑Action */}
        <section className="text-center py-8">
          <a
            href="/shop"
            className="inline-block bg-[#7d4b0e] text-white text-xs font-bold px-6 py-3 rounded-full hover:bg-[#6b400c] transition-colors"
          >
            Explore Our Handcrafted Khakhra Collection
          </a>
        </section>
      </div>
    </div>
  );
};

export default About;
