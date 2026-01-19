import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface SearchTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export default function SearchTabs({
    activeTab,
    onTabChange,
    searchQuery,
    onSearchChange,
}: SearchTabsProps) {
    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'tech', label: 'Tech' },
        { id: 'life', label: 'Life' },
    ];

    return (
        <section className="container mx-auto max-w-7xl px-4 pb-12">
            {/* Tabs */}
            <div className="flex gap-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`relative px-2 py-1 text-sm font-medium transition-colors duration-300 ${activeTab === tab.id
                            ? 'text-[rgb(19,22,35)] dark:text-white'
                            : 'text-[rgb(157,157,173)] hover:text-[rgb(19,22,35)] dark:text-gray-400 dark:hover:text-white'
                            }`}
                    >
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </div>

        </section>
    );
}
