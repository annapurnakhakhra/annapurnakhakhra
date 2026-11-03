import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export const GoToTopButton: React.FC = () => {
  const location = useLocation();
  const isProductPage = location.pathname.startsWith("/product");

  const [scrolled100, setScrolled100] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled100(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!scrolled100) return null;

  return (
    <>
      <button
        onClick={scrollToTop}
        className={`fixed right-4 z-[99] w-10 h-10 md:w-14 md:h-14 rounded-full bg-[#7d4b0e] hover:bg-yellow-600 text-white flex items-center justify-center shadow-lg transition-all gt-pulse-shadow ${
          isProductPage ? "bottom-44 md:bottom-40" : "bottom-32 md:bottom-24"
        }`}
        aria-label="Go to Top"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
        </svg>
      </button>

      <style>{`
        .gt-pulse-shadow {
          animation: gtpulseShadow 1.5s infinite;
        }

        @keyframes gtpulseShadow {
          0% {
            box-shadow: 0 0 0px #7d4b0e;
          }
          50% {
            box-shadow: 0 0 25px #7d4b0e;
          }
          100% {
            box-shadow: 0 0 0px #7d4b0e;
          }
        }
      `}</style>
    </>
  );
};

export default GoToTopButton;
