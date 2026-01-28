import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]); // Subtle parallax

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { y: 100, opacity: 0, rotateX: -45 },
    visible: {
      y: 0,
      opacity: 1,
      rotateX: 0,
      transition: {
        type: 'spring' as const,
        damping: 15,
        stiffness: 100,
      },
    },
  };

  return (
    <section className="relative w-full overflow-hidden">
      {/* Background Image & Overlay */}

      <div className="container mx-auto max-w-7xl px-4 py-16 text-center sm:py-20 md:py-28 lg:py-32">
        <motion.div
          ref={ref}
          style={{ y }}
          className="relative z-10"
          initial="hidden"
          animate="visible"
          variants={container}
        >
          <motion.div
            variants={item}
            className="mb-3 inline-flex items-center gap-1.5 font-mono text-xs tracking-wider uppercase font-semibold sm:mb-4 sm:gap-2 sm:text-sm"
          >
            <span className="text-life-orange">LifeLog</span>
            <span className="text-gray-400">&</span>
            <span className="text-tech-blue">Code</span>
          </motion.div>

          <div className="mb-6 overflow-hidden sm:mb-8">
            <h1 className="text-5xl font-black leading-none tracking-tighter text-gray-900 dark:text-gray-100 sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl">
              {Array.from("STORIES.").map((char, index) => (
                <motion.span
                  key={index}
                  variants={item}
                  className={`inline-block origin-bottom ${char === '.' ? 'text-tech-blue' : ''}`}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </h1>
          </div>

          <motion.p
            variants={item}
            className="mx-auto max-w-xs text-sm font-medium text-gray-400 dark:text-gray-500 sm:max-w-md sm:text-base md:max-w-xl md:text-lg lg:max-w-2xl lg:text-xl"
          >
            기술과 일상, 그 사이의 모든 이야기를 기록합니다.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
