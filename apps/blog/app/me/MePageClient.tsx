'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Github, Linkedin, Mail, ExternalLink } from 'lucide-react';

interface MePageClientProps {
    techPostsCount: number;
    lifePostsCount: number;
}

const techStack = [
    { name: 'TypeScript', category: 'Language', highlight: true },
    { name: 'React', category: 'Frontend', highlight: true },
    { name: 'Next.js', category: 'Framework', highlight: true },
    { name: 'Node.js', category: 'Backend', highlight: false },
    { name: 'Tailwind CSS', category: 'Styling', highlight: false },
    { name: 'Framer Motion', category: 'Animation', highlight: false },
    { name: 'Docker', category: 'DevOps', highlight: false },
    { name: 'AWS', category: 'Cloud', highlight: false },
];

const socialLinks = [
    { icon: Github, href: 'https://github.com/aksel26', label: 'GitHub' },
    { icon: Mail, href: 'mailto:kevinxkim2023@gmail.com', label: '이메일' },
];

export default function MePageClient({ techPostsCount, lifePostsCount }: MePageClientProps) {
    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1,
            },
        },
    };

    const fadeUp = {
        hidden: { y: 40, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                damping: 25,
                stiffness: 120,
            },
        },
    };

    const scaleIn = {
        hidden: { scale: 0.8, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: {
                type: 'spring',
                damping: 20,
                stiffness: 100,
            },
        },
    };

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <motion.section
                className="container mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-32 md:pb-24"
                initial="hidden"
                animate="visible"
                variants={container}
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-7 space-y-8">
                        <motion.div variants={fadeUp} className="space-y-2">
                            <span className="text-sm font-mono uppercase tracking-[0.2em] text-foreground/50 ">
                                FrontEnd Developer
                            </span>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mt-2">
                                <span className="text-electric-blue">김현민</span>
                                <span className="text-life-orange">.</span>
                            </h1>
                        </motion.div>

                        <motion.p
                            variants={fadeUp}
                            className="text-lg md:text-xl text-foreground/70 leading-relaxed max-w-xl"
                        >
                            직관적이고 빠른 웹 애플리케이션을 만듭니다.<br/>
                            새로운 기술을 탐구하고, 코드와 일상을 통해
                            그 여정을 나누는 것을 좋아합니다.
                        </motion.p>

                        {/* Social Links */}
                        <motion.div variants={fadeUp} className="flex items-center gap-4">
                            {socialLinks.map((social) => (
                                <Link
                                    key={social.label}
                                    href={social.href}
                                    target={social.href.startsWith('http') ? '_blank' : undefined}
                                    rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                                    className="group flex items-center justify-center w-12 h-12 rounded-full border border-foreground/10 hover:border-electric-blue hover:bg-electric-blue/5 transition-all duration-300"
                                    aria-label={social.label}
                                >
                                    <social.icon className="w-5 h-5 text-foreground/60 group-hover:text-electric-blue transition-colors" />
                                </Link>
                            ))}
                        </motion.div>
                    </div>

                    {/* Right Column - Stats Card */}
                    <motion.div
                        variants={scaleIn}
                        className="lg:col-span-5 relative"
                    >
                        <div className="relative p-8 rounded-2xl border border-foreground/10 bg-gradient-to-br from-foreground/[0.02] to-transparent backdrop-blur-sm">
                            {/* Decorative corner */}
                            <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-tech-blue rounded-tr-2xl -translate-y-px translate-x-px" />

                            <div className="space-y-6">
                                <div className="flex items-baseline gap-3">
                                    <span className="text-6xl md:text-7xl font-black text-tech-blue">
                                        {techPostsCount + lifePostsCount}
                                    </span>
                                    <span className="text-sm font-mono uppercase tracking-wider text-foreground/50">
                                        Stories
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-foreground/10">
                                    <Link href="/tech" className="group">
                                        <div className="text-3xl font-bold text-foreground group-hover:text-tech-blue transition-colors">
                                            {techPostsCount}
                                        </div>
                                        <div className="text-sm text-foreground/50 flex items-center gap-1">
                                            Tech
                                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </Link>
                                    <Link href="/life" className="group">
                                        <div className="text-3xl font-bold text-foreground group-hover:text-life-orange transition-colors">
                                            {lifePostsCount}
                                        </div>
                                        <div className="text-sm text-foreground/50 flex items-center gap-1">
                                           Life
                                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* Tech Stack Section */}
            <motion.section
                className="container mx-auto max-w-6xl px-6 py-16 md:py-24"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-100px' }}
                variants={container}
            >
                <motion.div variants={fadeUp} className="mb-12">
                    <span className="text-sm font-mono uppercase tracking-[0.2em] text-foreground/50">
                        사용하는 기술
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">
                        Tech <span className="text-tech-blue">Stack</span>
                    </h2>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {techStack.map((tech, index) => (
                        <motion.div
                            key={tech.name}
                            variants={fadeUp}
                            className={`group relative p-5 rounded-xl border transition-all duration-300 cursor-default
                                ${tech.highlight
                                    ? 'border-tech-blue/30 bg-tech-blue/5 hover:border-tech-blue hover:bg-tech-blue/10'
                                    : 'border-foreground/10 hover:border-foreground/20 hover:bg-foreground/[0.02]'
                                }`}
                        >
                            <div className="space-y-1">
                                <div className={`text-lg font-semibold ${tech.highlight ? 'text-tech-blue' : 'text-foreground'}`}>
                                    {tech.name}
                                </div>
                                <div className="text-xs font-mono uppercase tracking-wider text-foreground/40">
                                    {tech.category}
                                </div>
                            </div>
                            {tech.highlight && (
                                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-tech-blue animate-pulse" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* CTA Section */}
            <motion.section
                className="container mx-auto max-w-6xl px-6 py-16 md:py-24"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-100px' }}
                variants={container}
            >
                <motion.div
                    variants={scaleIn}
                    className="relative overflow-hidden rounded-2xl bg-foreground p-8 md:p-12"
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03]">
                        <div className="absolute inset-0" style={{
                            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                            backgroundSize: '24px 24px',
                        }} />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl md:text-3xl font-bold text-background">
                                함께 이야기해요
                            </h2>
                            <p className="text-background/60 max-w-md">
                                궁금한 점이 있거나 협업을 원하신다면 편하게 연락주세요.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/tech"
                                className="inline-flex items-center gap-2 rounded-full bg-background text-foreground px-6 py-3 font-medium hover:bg-background/90 transition-colors"
                            >
                                블로그 보기
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                            <Link
                                href='mailto:kevinxkim2023@gmail.com'
                                className="inline-flex items-center gap-2 rounded-full border border-background/20 text-background px-6 py-3 font-medium hover:bg-background/10 transition-colors"
                            >
                                <Mail className="w-4 h-4" />
                                연락하기
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </motion.section>
        </div>
    );
}
