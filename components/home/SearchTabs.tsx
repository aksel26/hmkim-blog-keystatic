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
            <div className="flex justify-between items-center gap-6">
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

                {/* Search Input */}
                <div className="relative w-full max-w-md group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-foreground transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search posts..."
                        className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-gray-400 dark:focus:border-gray-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-800 text-foreground"
                    />
                </div>
            </div>
        </section>
    );
}
