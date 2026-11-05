import React from "react";

interface FestiveNoticeBannerProps {
  className?: string;
  imageClassName?: string;
}

export const BANNER_IMAGE_URL =
  "https://megaecomm.megascale.co.in/backend/media/16/general/623875722fbed5ac54aa7240912aaa8c.webp";

export const FestiveNoticeBanner: React.FC<FestiveNoticeBannerProps> = ({
  className = "",
  imageClassName = "",
}) => {
  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <img
        src={BANNER_IMAGE_URL}
        alt="Diwali Holidays Courier Service Notice (6 Nov to 14 Nov)"
        className={`w-full h-auto object-cover rounded-2xl shadow-xs border border-amber-900/10 ${imageClassName}`}
        loading="eager"
      />
    </div>
  );
};

export default FestiveNoticeBanner;

