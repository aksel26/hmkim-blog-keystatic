'use client';

import { Share2, Heart, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StickySidebar() {
    return (
        <div className="hidden ml-[-100px] xl:block fixed top-1/2 -translate-y-1/2 left-[calc(50%-560px)] z-10 w-12">
            <div className="flex flex-col items-center gap-6">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
                >
                    <Share2 className="h-5 w-5" />
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
                >
                    <Heart className="h-5 w-5" />
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
                >
                    <MessageCircle className="h-5 w-5" />
                </motion.button>
            </div>
        </div>
    );
}
