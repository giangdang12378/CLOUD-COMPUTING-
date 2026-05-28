import React, { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
// import 'swiper/css/pagination';

const CoverflowSwiper = ({ 
  slides = [],
  autoplay = true,
  loop = true,
  centeredSlides = true,
  slidesPerView = 3,
  coverflowEffect = {
    rotate: 50,
    stretch: 0,
    depth: 100,
    modifier: 1,
    slideShadows: true,
  },
  pagination = true,
  className = ""
}) => {
  const swiperRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Dữ liệu mẫu nếu không có slides
  const defaultSlides = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1920&auto=format&fit=crop",
      hoverImage: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=1935&auto=format&fit=crop",
    },
    {
      id: 2,
      image: "https://i.pinimg.com/1200x/ab/6d/86/ab6d8652c728b8f81754cb50f6dfc625.jpg",
      hoverImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1920&auto=format&fit=crop",
      hoverImage: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1920&auto=format&fit=crop",
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
      hoverImage: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop",
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=2070&auto=format&fit=crop",
      hoverImage: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop",
    },
    {
      id: 6,
      image: "https://i.pinimg.com/736x/cd/1c/d1/cd1cd1119fa79a1735cd75471caa32b9.jpg",
      hoverImage: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop",
    }
  ];

  const slidesData = slides.length > 0 ? slides : defaultSlides;

  // Hàm xử lý khi slide thay đổi
  const handleSlideChange = (swiper) => {
    setActiveIndex(swiper.realIndex);
  };

  // Hàm xử lý click slide để chuyển về giữa
  const handleSlideClick = (slideIndex) => {
    const swiper = swiperRef.current?.swiper;
    if (!swiper || slideIndex === activeIndex) return;
  
    // Nếu dùng loop thì dùng slideToLoop để tránh nhảy xa
    if (swiper.params.loop) {
      swiper.slideToLoop(slideIndex, 600, false);
    } else {
      // Nếu không loop thì tính khoảng cách hợp lý
      swiper.slideTo(slideIndex, 600, false);
    }
  };
  
  return (
    <div className={`coverflow-container ${className}`}>
      <Swiper
        ref={swiperRef}
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={centeredSlides}
        slidesPerView={slidesPerView}
        loop={loop}
        coverflowEffect={coverflowEffect}
        pagination={pagination ? {
          clickable: true,
          dynamicBullets: true,
        } : false}
        autoplay={autoplay ? {
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        } : false}
        modules={[EffectCoverflow, Pagination, Autoplay]}
        className="coverflow-swiper"
        onSlideChange={handleSlideChange}
        speed={600}
        breakpoints={{
          320: {
            slidesPerView: 1,
            spaceBetween: 20,
          },
          640: {
            slidesPerView: 2,
            spaceBetween: 30,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 40,
          },
        }}
      >
        {slidesData.map((slide, index) => (
          <SwiperSlide key={slide.id || index} className="coverflow-slide">
            <div 
              className="slide-content"
              onClick={() => handleSlideClick(index)}
            >
              <div className="slide-image-container">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="slide-image default-image"
                />
                <img
                  src={slide.hoverImage || slide.image}
                  alt={slide.title}
                  className="slide-image hover-image"
                />
                <div className="slide-overlay"></div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx>{`
  .coverflow-container {
    padding: 50px 0;
    max-width: 900px;
    margin: 0 auto;
  }

  .coverflow-swiper {
    width: 100%;
    padding-top: 50px;
    padding-bottom: 50px;
  }

  .coverflow-slide {
    background-position: center;
    background-size: cover;
    width: 380px;
    height: 450px;
    cursor: pointer;
  }

  .slide-content {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 20px;
    overflow: hidden;
    background: transparent;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .slide-content:hover {
    transform: translateY(-8px);
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
  }

  .slide-image-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 20px;
    transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .slide-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    position: absolute;
    top: 0;
    left: 0;
    transition: all 0.5s ease;
    border-radius: 20px;
  }

  .default-image {
    opacity: 1;
    z-index: 1;
    transform: scale(1);
  }

  .hover-image {
    opacity: 0;
    z-index: 2;
    transform: scale(1.05);
  }

  .slide-image-container:hover .default-image {
    opacity: 0;
    transform: scale(1.1);
  }

  .slide-image-container:hover .hover-image {
    opacity: 1;
    transform: scale(1);
  }

  .slide-overlay {
    position: absolute;
    inset: 0; /* top:0; right:0; bottom:0; left:0 */
    background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.7) 100%);
    z-index: 3;
    border-radius: 20px;
  }

  /* Slide active ở giữa */
  :global(.swiper-slide-active) .slide-content {
    transform: scale(1.02);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.35);
    cursor: default;
  }

  /* Slide prev/next */
  :global(.swiper-slide-prev) .slide-image-container:hover,
  :global(.swiper-slide-next) .slide-image-container:hover {
    transform: scale(1.02); /* scale duy nhất, overlay ăn khớp */
  }

  :global(.swiper-slide-prev) .slide-content,
  :global(.swiper-slide-next) .slide-content {
    opacity: 0.8;
    transition: all 0.4s ease;
    cursor: pointer;
  }

  :global(.swiper-slide-prev) .slide-content:hover,
  :global(.swiper-slide-next) .slide-content:hover {
    opacity: 1;
    transform: translateY(-5px); /* bỏ scale ở đây */
  }

  :global(.swiper-slide-prev) .slide-content:active,
  :global(.swiper-slide-next) .slide-content:active {
    transform: translateY(-2px) scale(0.98);
  }

  /* Custom Swiper Pagination */
  :global(.swiper-pagination) {
    bottom: 10px !important;
  }

  :global(.swiper-pagination-bullet) {
    background: rgba(0, 0, 0, 0.3) !important;
    opacity: 1 !important;
    width: 10px !important;
    height: 10px !important;
    margin: 0 6px !important;
    transition: all 0.3s ease !important;
  }

  :global(.swiper-pagination-bullet-active) {
    background: #667eea !important;
    transform: scale(1.3) !important;
    box-shadow: 0 0 10px rgba(102, 126, 234, 0.5) !important;
  }

  :global(.swiper-button-next),
  :global(.swiper-button-prev) {
    display: none !important;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .coverflow-slide {
      width: 250px;
      height: 350px;
    }

    .slide-title {
      font-size: 1.1rem;
    }

    .slide-info {
      padding: 15px;
    }

    .slide-description {
      font-size: 0.8rem;
    }
  }

  @media (max-width: 640px) {
    .coverflow-container {
      padding: 30px 0;
      max-width: 100%;
    }

    .slide-content:hover {
      transform: translateY(-5px);
    }
  }
`}</style>

    </div>
  );
};

export default CoverflowSwiper;