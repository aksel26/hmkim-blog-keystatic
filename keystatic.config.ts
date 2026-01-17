import { config, fields, collection } from '@keystatic/core';
import { block } from '@keystatic/core/content-components';

// 비디오 컴포넌트 정의
const videoComponent = (directory: string, publicPath: string) => block({
  label: '비디오',
  schema: {
    src: fields.file({
      label: '비디오 파일',
      directory,
      publicPath,
    }),
    autoplay: fields.checkbox({
      label: '자동 재생',
      defaultValue: false,
    }),
    loop: fields.checkbox({
      label: '반복 재생',
      defaultValue: false,
    }),
    muted: fields.checkbox({
      label: '음소거',
      defaultValue: false,
    }),
    controls: fields.checkbox({
      label: '컨트롤 표시',
      defaultValue: true,
    }),
  },
});

// 공통 스키마 필드
const commonFields = {
  // slug (title에서 자동 생성)
  title: fields.slug({ name: { label: '제목' } }),

  // 요약
  summary: fields.text({
    label: '요약',
    description: '게시글 요약',
    multiline: true,
  }),

  // 키워드
  keywords: fields.array(
    fields.text({ label: '키워드' }),
    {
      label: '키워드',
      itemLabel: (props) => props.value,
    }
  ),

  // 상태 (초안, 배포)
  status: fields.select({
    label: '상태',
    options: [
      { label: '초안', value: 'draft' },
      { label: '배포', value: 'published' },
    ],
    defaultValue: 'draft',
  }),

  // Tags
  tags: fields.array(
    fields.text({ label: 'Tag' }),
    {
      label: 'Tags',
      itemLabel: (props) => props.value,
    }
  ),

  // 등록일
  createdAt: fields.date({
    label: '등록일',
    defaultValue: { kind: 'today' },
  }),

  // 수정일
  updatedAt: fields.date({
    label: '수정일',
    defaultValue: { kind: 'today' },
  }),

  // Thumbnail (image)
  thumbnailImage: fields.image({
    label: '썸네일 이미지',
    directory: 'public/images/thumbnails',
    publicPath: '/images/thumbnails/',
  }),

  // Thumbnail (video/mov)
  thumbnailVideo: fields.file({
    label: '썸네일 비디오',
    directory: 'public/videos/thumbnails',
    publicPath: '/videos/thumbnails/',
  }),
};

export default config({
  storage:
    {
      kind: 'github',
      repo: {
        owner: 'aksel26',
        name: 'hmkim-blog-keystatic',
      },
    },
  collections: {
    tech: collection({
      label: 'Tech',
      slugField: 'title',
      path: 'content/tech/*',
      format: { contentField: 'content' },
      schema: {
        ...commonFields,
        content: fields.markdoc({
          label: '내용',
          options: {
            image: {
              directory: 'public/images/tech',
              publicPath: '/images/tech/',
            },
          },
          components: {
            video: videoComponent('public/videos/tech', '/videos/tech/'),
          },
        }),
      },
    }),
    life: collection({
      label: 'Life',
      slugField: 'title',
      path: 'content/life/*',
      format: { contentField: 'content' },
      schema: {
        ...commonFields,
        content: fields.markdoc({
          label: '내용',
          options: {
            image: {
              directory: 'public/images/life',
              publicPath: '/images/life/',
            },
          },
          components: {
            video: videoComponent('public/videos/life', '/videos/life/'),
          },
        }),
      },
    }),
  },
});
