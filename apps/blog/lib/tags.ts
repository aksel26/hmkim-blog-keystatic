// 한/영 동의어만 둔다. 대소문자·공백·점 차이는 baseKey가 자동으로 합친다.
// 키는 baseKey를 거친 형태로 적는다.
const TAG_ALIASES: Record<string, string> = {
  '프론트엔드': 'Frontend',
  '프론트엔드개발': 'Frontend',
  '클로드코드': 'Claude Code',
  'claudecode': 'Claude Code',
  '클로드': 'Claude',
  'performance': '성능최적화',
  '보안': 'Security',
  '깃허브': 'Github',
  '인공지능': 'AI',
  'investment': '투자',
  'elonmusk': '일론머스크',
};

const baseKey = (tag: string) => tag.toLowerCase().replace(/[\s.]/g, '');

/** 화면에 보여 줄 표기 */
export const canonicalTag = (tag: string) => TAG_ALIASES[baseKey(tag)] ?? tag.trim();

/** 두 태그가 같은지 비교하는 기준 */
export const tagKey = (tag: string) => baseKey(canonicalTag(tag));

export interface TagCount {
  key: string;
  label: string;
  count: number;
}

/** 태그별 글 수. 글 수 내림차순, 같으면 이름순 */
export function countTags(posts: { tags?: readonly string[] }[]): TagCount[] {
  // key → 표기 → 글 수
  const groups = new Map<string, Map<string, number>>();

  for (const post of posts) {
    const seen = new Set<string>();
    for (const tag of post.tags ?? []) {
      const key = tagKey(tag);
      if (!key || seen.has(key)) continue;
      seen.add(key);

      const labels = groups.get(key) ?? new Map<string, number>();
      const label = canonicalTag(tag);
      labels.set(label, (labels.get(label) ?? 0) + 1);
      groups.set(key, labels);
    }
  }

  return [...groups]
    .map(([key, labels]) => {
      const sorted = [...labels].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'));
      return {
        key,
        label: sorted[0][0],
        count: sorted.reduce((sum, [, n]) => sum + n, 0),
      };
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ko'));
}
