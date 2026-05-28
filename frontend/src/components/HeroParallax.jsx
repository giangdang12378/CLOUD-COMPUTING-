import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";

const HeroParallax = ({ items }) => {
  const firstRow = items.slice(0, 5);
  const secondRow = items.slice(5, 10);
  const thirdRow = items.slice(10, 15);

  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig
  );

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div className="relative h-[400px]"> {/* điều chỉnh chiều cao */}
        <motion.div
          style={{ x: translateX, opacity, rotateX }}
          className="absolute top-0 left-0 flex space-x-4"
        >
          {firstRow.map((item, i) => (
            <img key={i} src={item.thumbnail} alt={item.title} className="w-48 h-48 object-cover" />
          ))}
        </motion.div>

        <motion.div
          style={{ x: translateXReverse, opacity, rotateX }}
          className="absolute top-0 left-0 flex space-x-4"
        >
          {secondRow.map((item, i) => (
            <img key={i} src={item.thumbnail} alt={item.title} className="w-48 h-48 object-cover" />
          ))}
        </motion.div>

        {/* Bạn có thể thêm hàng thứ ba nếu cần */}
      </div>
    </section>
  );
};

export default HeroParallax;
