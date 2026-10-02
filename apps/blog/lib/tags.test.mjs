import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalTag, countTags, tagKey } from './tags.ts';

test('표기만 다른 태그는 같은 키가 된다', () => {
  assert.equal(tagKey('Javascript'), tagKey('JavaScript'));
  assert.equal(tagKey('Nodejs'), tagKey('Node.js'));
  assert.equal(tagKey('웹 개발'), tagKey('웹개발'));
});

test('동의어는 alias 대상으로 합쳐진다', () => {
  assert.equal(tagKey('프론트엔드'), tagKey('Frontend'));
  assert.equal(tagKey('프론트엔드 개발'), tagKey('frontend'));
  assert.equal(canonicalTag('클로드 코드'), 'Claude Code');
  assert.equal(canonicalTag('React'), 'React');
});

test('countTags는 글 단위로 세고 글 수 순으로 정렬한다', () => {
  const result = countTags([
    { tags: ['React', 'Frontend', '프론트엔드'] },
    { tags: ['react', 'Zustand'] },
    { tags: ['React'] },
    {},
  ]);

  assert.deepEqual(result, [
    { key: 'react', label: 'React', count: 3 },
    { key: 'frontend', label: 'Frontend', count: 1 },
    { key: 'zustand', label: 'Zustand', count: 1 },
  ]);
});
