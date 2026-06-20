import { getAllTechPosts, getAllLifePosts } from '@/lib/keystatic/reader';
import MePageClient from './MePageClient';
import { PersonSchema } from '@/components/schema';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hmkim.blog';

export const metadata: Metadata = {
    title: 'Me — 김현민',
    description: '직관적이고 빠른 웹 애플리케이션을 만드는 프론트엔드 개발자입니다.',
    alternates: {
        canonical: `${baseUrl}/me`,
    },
    openGraph: {
        title: 'Me — 김현민',
        description: '직관적이고 빠른 웹 애플리케이션을 만드는 프론트엔드 개발자입니다.',
        url: `${baseUrl}/me`,
        type: 'profile',
        siteName: 'HM Blog',
        locale: 'ko_KR',
    },
};

export default async function MePage() {
    const techPosts = await getAllTechPosts();
    const lifePosts = await getAllLifePosts();

    return (
        <>
            <PersonSchema />
            <MePageClient techPostsCount={techPosts.length} lifePostsCount={lifePosts.length} />
        </>
    );
}
