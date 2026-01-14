import { getAllTechPosts, getAllLifePosts } from '@/lib/keystatic/reader';
import Link from 'next/link';

export default async function MePage() {
    const techPosts = await getAllTechPosts();
    const lifePosts = await getAllLifePosts();

    // Simple stats
    const stats = [
        { label: 'Technology Posts', value: techPosts.length },
        { label: 'Life Logs', value: lifePosts.length },
    ];

    return (
        <div className="container mx-auto px-6 py-20 max-w-2xl">
            <div className="flex flex-col items-center text-center space-y-8">

                {/* Profile Image Placeholder - You can add a real one later */}
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-electric-blue to-purple-500 shadow-lg flex items-center justify-center text-4xl">
                    👋
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">
                        Hi, I'm <span className="text-electric-blue">Hyunmin Kim</span>.
                    </h1>
                    <p className="text-lg text-foreground/70 leading-relaxed">
                        I'm a software engineer passionate about building intuitive and performant web applications.
                        I love exploring new technologies and sharing my journey through code and daily life.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-8 w-full max-w-sm pt-8 border-t">
                    {stats.map((stat) => (
                        <div key={stat.label} className="flex flex-col">
                            <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                            <span className="text-sm text-foreground/60">{stat.label}</span>
                        </div>
                    ))}
                </div>

                <div className="flex gap-4 pt-8">
                    <Link
                        href="/tech"
                        className="rounded-full bg-foreground text-background px-6 py-3 font-medium hover:bg-foreground/90 transition-colors"
                    >
                        Read Tech Blog
                    </Link>
                    <Link
                        href="mailto:contact@hmkim.dev"
                        className="rounded-full border border-input bg-transparent px-6 py-3 font-medium hover:bg-accent transition-colors"
                    >
                        Contact Me
                    </Link>
                </div>

            </div>
        </div>
    );
}
