'use client';

import { useState, useMemo } from 'react';
import Hero from './Hero';
import SearchTabs from './SearchTabs';
import MasonryGrid, { Post } from './MasonryGrid';

interface HomeContentProps {
    initialPosts: Post[];
}

export default function HomeContent({ initialPosts }: HomeContentProps) {
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPosts = useMemo(() => {
        return initialPosts.filter((post) => {
            // Filter by Tab
            if (activeTab !== 'all' && post.type !== activeTab) {
                return false;
            }

            // Filter by Search Query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const titleMatch = post.title.toLowerCase().includes(query);
                const summaryMatch = post.summary?.toLowerCase().includes(query);
                const tagMatch = post.tags?.some((tag) => tag.toLowerCase().includes(query));
                const categoryMatch = post.category?.toLowerCase().includes(query);

                return titleMatch || summaryMatch || tagMatch || categoryMatch;
            }

            return true;
        });
    }, [initialPosts, activeTab, searchQuery]);

    return (
        <div className="min-h-screen bg-background">
            <Hero />
            <SearchTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />
            <MasonryGrid posts={filteredPosts} />
        </div>
    );
}
