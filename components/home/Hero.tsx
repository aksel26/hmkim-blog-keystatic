import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="container mx-auto max-w-7xl px-4 py-20 text-center md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className="mb-4 inline-block font-mono text-sm tracking-wider uppercase text-gray-500">
          LifeLog & Code
        </span>
        <h1 className="mb-8 text-6xl font-black leading-tight tracking-tighter text-foreground md:text-8xl lg:text-9xl">
          STORIES.
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-foreground/60 md:text-2xl font-light">
          A collection of thoughts on technology, life, and everything in between.
        </p>
      </motion.div>
    </section>
  );
}
