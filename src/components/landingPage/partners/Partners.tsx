import React from 'react';
import Slider from 'react-slick';
import style from './style.module.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useTranslation } from 'react-i18next';

const logos = [
  '/img/image54.png',
  '/img/image54.png',
  '/img/image54.png',
  '/img/image54.png',
  '/img/image54.png',
  '/img/image54.png',
  '/img/image54.png',
  '/img/image54.png',
];

const Partners: React.FC = () => {
  const settings = {
    infinite: true,
    speed: 5000,
    slidesToShow: 6,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 0,
    cssEase: 'linear',
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
          infinite: true,
          autoplay: true,
        },
      },
      {
        breakpoint: 900,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: true,
          autoplay: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: true,
          autoplay: true,
        },
      },
    ],
  };

  const { t } = useTranslation("global");

  return (
    <div className={style.carouselContainer}>
      <h1>{t("PARTNERS")}</h1>
      <Slider {...settings}>
        {logos.map((logo, index) => (
          <div key={index} className={style.logoContainer}>
            {/* Using a regular img tag instead of next/image */}
            <img
              src={logo}
              alt={`Partner logo ${index + 1}`}
              width={150}
              height={100}
              className={style.logo}
              style={{ objectFit: 'contain' }} // Added style for object fit
            />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default Partners;
