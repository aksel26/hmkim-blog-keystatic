import { getAllTechPosts, getAllLifePosts } from '@/lib/keystatic/reader';
import MePageClient from './MePageClient';

export const metadata = {
    title: 'Me — 김현민',
    description: '직관적이고 빠른 웹 애플리케이션을 만드는 프론트엔드 개발자입니다.',
};

export default async function MePage() {
    const techPosts = await getAllTechPosts();
    const lifePosts = await getAllLifePosts();

    return <MePageClient techPostsCount={techPosts.length} lifePostsCount={lifePosts.length} />;
}
