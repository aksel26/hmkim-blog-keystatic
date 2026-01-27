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

      <div className="container mx-auto max-w-7xl px-4 py-20 text-center md:py-32">
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
            className="mb-4 inline-flex items-center gap-2 font-mono text-sm tracking-wider uppercase font-semibold"
          >
            <span className="text-life-orange">LifeLog</span>
            <span className="text-gray-400">&</span>
            <span className="text-tech-blue">Code</span>
          </motion.div>

          <div className="mb-8 overflow-hidden">
            <h1 className="text-8xl font-black leading-tight tracking-tighter text-gray-900 dark:text-gray-100 md:text-8xl lg:text-9xl">
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
            className="mx-auto max-w-2xl text-md font-medium dark:text-gray-500 text-gray-400 md:text-xl"
          >
            A collection of thoughts on technology, life, and everything in between.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
