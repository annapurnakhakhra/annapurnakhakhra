import React, { useEffect, useState } from "react";

export const TopOfferBar: React.FC = () => {
  const offers = [
    <>
      Free Shipping on Orders Above{" "}
      <span className="highlight">₹599</span>
    </>
    // <>
    //   Get <span className="highlight">10% Discount</span> on Prepaid Orders
    // </>
  ];

  const [currentOffer, setCurrentOffer] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(false);

      setTimeout(() => {
        setCurrentOffer((prev) => (prev + 1) % offers.length);
        setAnimate(true);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="offer-wrapper">
        <div className={`offer-text ${animate ? "slide-in" : "slide-out"}`}>
          {offers[currentOffer]}
        </div>
      </div>

      <style>{`
        .offer-wrapper {
          width: 100%;
          background: #7d4b0e;
          color: white;
          padding: 8px 16px;
          text-align: center;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          overflow: hidden;
          position: relative;
          z-index: 50;
        }

        .offer-text {
          transition: all 0.4s ease;
        }

        .slide-in {
          opacity: 1;
          transform: translateY(0);
        }

        .slide-out {
          opacity: 0;
          transform: translateY(-20px);
        }

        .highlight {
          font-size: 14px;
          font-weight: 800;
          padding: 0 4px;
          animation: glow 1.6s infinite ease-in-out;
        }

        @media (max-width: 768px) {
          .offer-wrapper {
            font-size: 10px;
          }
          .highlight {
            font-size: 12px;
          }
        }

        @keyframes glow {
          0% {
            text-shadow: 0 0 4px #fde68a;
          }
          50% {
            text-shadow: 0 0 12px #fff, 0 0 20px #fde68a;
          }
          100% {
            text-shadow: 0 0 4px #fde68a;
          }
        }
      `}</style>
    </>
  );
};

export default TopOfferBar;
