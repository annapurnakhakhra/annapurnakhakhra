import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { FaInstagram, FaFacebook, FaWhatsapp, FaYoutube } from "react-icons/fa";

export const Footer: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (name: string) => {
    setOpenSection(openSection === name ? null : name);
  };

  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Collection", path: "/shopbycollection" },
    { name: "Shop All", path: "/shop" },
    { name: "Blog", path: "/blog" },
    { name: "Contact", path: "/contact" },
  ];

  const policiesLinks = [
    { name: "Terms & Conditions", path: "/terms-and-condition" },
    { name: "Shipping Policy", path: "/shipping-policy" },
    { name: "Return Policy", path: "/return-policy" },
    { name: "Privacy Policy", path: "/privacy-policy" },
  ];

  return (
    <footer
      className="bg-yellow-50 text-gray-800 border-t border-amber-200 w-full relative z-10"
      style={{
        backgroundImage: "url('https://cdn.shopify.com/s/files/1/0953/6284/2993/files/Gemini_Generated_Image_rx1vlzrx1vlzrx1v_1.png?v=1774076162')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* BRAND */}
        <div className="text-center md:text-left">
          <Link to="/" className="inline-block mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7d4b0e] to-[#cc760e] flex items-center justify-center text-white font-extrabold text-2xl shadow-md font-serif">
              अ
            </div>
          </Link>
          <h3 className="text-xl font-black text-[#7d4b0e] font-serif mb-1">ANNAPURNA</h3>

          <p className="text-amber-800 font-body text-xs sm:text-sm leading-relaxed">
            Khakhra brings the crunchy delight of Gujarati tradition to your table.
            <span className="text-amber-900 font-bold block mt-1">
              Crispy. Flavorful. Authentic.
            </span>
          </p>

          {/* Social Media Links */}
          <div className="flex justify-center md:justify-start gap-3 mt-5">
            <a
              href="https://www.instagram.com/annapurna_khakhra"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center hover:scale-110 transition shadow-md text-white"
            >
              <FaInstagram className="w-4 h-4" />
            </a>

            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center hover:scale-110 transition shadow-md text-white"
            >
              <FaFacebook className="w-4 h-4" />
            </a>

            <a
              href="https://wa.me/9638478118"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center hover:scale-110 transition shadow-md text-white"
            >
              <FaWhatsapp className="w-4 h-4" />
            </a>

            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center hover:scale-110 transition shadow-md text-white"
            >
              <FaYoutube className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="md:text-left border-b border-amber-200/60 md:border-none pb-4 md:pb-0">
          <button
            className="w-full flex justify-between items-center md:block text-left"
            onClick={() => toggleSection("quick")}
          >
            <h3 className="text-base font-bold text-amber-900 mb-3 font-serif">Quick Links</h3>
            <span className="md:hidden text-amber-900">
              {openSection === "quick" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </button>
          <ul className={`space-y-2 text-xs sm:text-sm ${openSection === "quick" ? "block" : "hidden md:block"}`}>
            {quickLinks.map((link) => (
              <li key={link.path}>
                <Link to={link.path} className="text-amber-800 hover:text-amber-950 transition-colors font-medium">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* POLICIES */}
        <div className="md:text-left border-b border-amber-200/60 md:border-none pb-4 md:pb-0">
          <button
            className="w-full flex justify-between items-center md:block text-left"
            onClick={() => toggleSection("policies")}
          >
            <h3 className="text-base font-bold text-amber-900 mb-3 font-serif">Legal & Policies</h3>
            <span className="md:hidden text-amber-900">
              {openSection === "policies" ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </button>
          <ul className={`space-y-2 text-xs sm:text-sm ${openSection === "policies" ? "block" : "hidden md:block"}`}>
            {policiesLinks.map((link) => (
              <li key={link.path}>
                <Link to={link.path} className="text-amber-800 hover:text-amber-950 transition-colors font-medium">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* CONTACT INFO */}
        <div>
          <h3 className="text-base font-bold text-amber-900 mb-3 font-serif">Contact Us</h3>
          <ul className="space-y-3 text-xs sm:text-sm text-amber-900 font-medium">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#7d4b0e] shrink-0 mt-0.5" />
              <span>Surat, Gujarat, India - 395007</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#7d4b0e] shrink-0" />
              <span>+91 96384 78118</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#7d4b0e] shrink-0" />
              <span>support@annapurnakhakhra.com</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="border-t border-amber-200/80 bg-amber-900/90 text-amber-100 py-4 px-4 text-center text-xs">
        <p>© 2026 Annapurna Khakhra. All Rights Reserved. MegaEcom Integration Active.</p>
      </div>
    </footer>
  );
};

export default Footer;
