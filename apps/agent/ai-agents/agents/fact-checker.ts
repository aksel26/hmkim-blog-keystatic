/**
 * Fact Checker Agent
 * 최종본의 사실 주장을 리서치 자료와 대조한다.
 *
 * 결과는 배포를 막지 않는다. LLM 판정에는 오탐이 있어서 고칠지는 사람이 humanReview에서 정한다.
 * 같은 이유로 이 단계가 실패해도 워크플로우를 멈추지 않는다 (factCheckResult 없이 진행).
 */

import { gemini } from '../config/models';
import { BlogPostState, FactCheckIssue, FactCheckResult, OnProgressCallback } from '../types/workflow';

const VERDICTS = ['contradicted', 'unsupported', 'code'] as const;
const SEVERITIES = ['high', 'medium', 'low'] as const;

/** 모델 응답에서 형식이 맞는 항목만 남긴다 */
export function parseFactCheck(raw: string): FactCheckResult {
  const json = raw.match(/\{[\s\S]*\}/);
  if (!json) throw new Error('정확도 검증 결과 JSON을 추출할 수 없습니다.');
  const parsed = JSON.parse(json[0]);
  const issues: FactCheckIssue[] = (Array.isArray(parsed.issues) ? parsed.issues : [])
    .filter((i: Partial<FactCheckIssue>) => i && typeof i.claim === 'string' && typeof i.problem === 'string')
    .map((i: Partial<FactCheckIssue>) => ({
      claim: i.claim!,
      verdict: VERDICTS.includes(i.verdict as never) ? i.verdict! : 'unsupported',
      severity: SEVERITIES.includes(i.severity as never) ? i.severity! : 'medium',
      problem: i.problem!,
      suggestion: typeof i.suggestion === 'string' ? i.suggestion : '',
      ...(typeof i.source === 'number' ? { source: i.source } : {}),
    }));
  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    issues,
    ...(Array.isArray(parsed.statements)
      ? { checkedClaims: parsed.statements.length + (Array.isArray(parsed.calls) ? parsed.calls.length : 0) }
      : {}),
  };
}

export async function factChecker(
  state: BlogPostState,
  onProgress?: OnProgressCallback
): Promise<Partial<BlogPostState>> {
  try {
    onProgress?.({ step: 'fact_check', status: 'started', message: '본문의 사실 주장을 참고 자료와 대조하는 중...' });

    if (!state.finalContent) throw new Error('검증할 최종본이 없습니다.');

    const sources = state.researchData?.sources ?? [];
    const isLifeCategory = state.category === 'life';

    // 코드 예제 검증은 tech 글에만 적용한다
    const listCallsStep = isLifeCategory
      ? '   개인적인 경험과 감상은 나열하지 않는다.'
      : '2. 코드 블록에 나오는 라이브러리 함수 호출을 전부 calls에 호출식 그대로 나열한다.';
    const judgeCallsStep = isLifeCategory
      ? ''
      : '5. call마다 인자 위치와 옵션 이름이 공식 시그니처와 맞는지 판정한다 (ok | wrong | unsure). 자료에 시그니처가 있으면 자료를, 없으면 네 지식을 기준으로 삼고 basis에 밝힌다 (source | knowledge).';
    const callIssueRule = isLifeCategory
      ? ''
      : '   - wrong인 call → verdict "code". unsure인 call → verdict "unsupported", severity low';

    const prompt = `
당신은 블로그 글의 팩트체커입니다. 아래 글에서 사실 주장을 뽑아 참고 자료와 대조하세요.
글을 고치지 말고 문제만 보고합니다.

주제: ${state.topic}

## 절차 (순서대로 수행)
확인하기 쉬운 문장만 고르면 틀린 문장을 놓친다. 고르지 말고 전부 나열한 다음 하나씩 판정한다.

1. 글에서 옵션·API·제품의 동작, 기본값, 수치, 버전, 날짜, 절차를 설명하는 문장을 전부 statements에 나열한다 (최대 25개). 코드 주석에 적힌 동작 설명도 포함한다. 같은 옵션이라도 값마다(true일 때, false일 때) 설명이 다르면 따로 나열한다.
${listCallsStep}
3. statement마다 참고 자료에서 같은 대상을 설명하는 문장을 찾아 evidence에 그대로 옮긴다. 없으면 null로 두고, evidence를 지어내지 않는다.
   참고 자료는 중간이 "[...]"로 잘린 발췌문이다. 잘린 자리 뒤의 문장은 바로 앞 항목이 아니라 다른 항목의 설명일 수 있으니, 문장의 뜻으로 어느 항목의 설명인지 판단한다.
4. statement를 판정한다.
   - ok: evidence와 같은 뜻이다.
   - contradicted: evidence와 다르다. 단어가 비슷해도 동작이 다르면 contradicted다. 예: 자료는 "캐시에 값이 있으면 네트워크 요청을 하지 않는다"인데 글은 "캐시 값을 먼저 보여주고 네트워크 요청도 보낸다"라고 썼다.
   - unsupported: 자료에 없다. 이때 네가 아는 공식 동작과 맞는지 knowledge에 적는다 (agrees | disagrees | unsure).
${judgeCallsStep}
6. issues에는 다음만 넣는다.
   - contradicted인 statement → verdict "contradicted"
   - unsupported이면서 knowledge가 disagrees인 statement → verdict "unsupported". problem에 "참고 자료에는 없고, 알려진 동작과 다르다"는 점과 네가 아는 동작을 적는다.
   - unsupported이면서 knowledge가 unsure이고 틀렸을 때 독자가 피해를 볼 statement → verdict "unsupported", severity는 low나 medium
${callIssueRule}

## 심각도 (severity)
- high: 독자가 그대로 따라 하면 오류가 나거나 잘못된 결정을 내린다
- medium: 부정확하지만 큰 피해는 없다
- low: 표현이 모호하거나 근거를 밝히면 나아진다

## 원칙
- ok로 판정한 것은 issues에 넣지 않는다.
- 자료가 아니라 네 지식에 근거한 지적은 problem에 "공식 문서 확인 필요"라고 밝힌다.
- 문제를 억지로 만들지 않는다. 문제가 없으면 issues를 빈 배열로 둔다.
- 틀렸다고 확신할 수 없으면 contradicted가 아니라 unsupported로 분류한다.
- 주제와 무관한 참고 자료는 무시한다.
- 문체, SEO, 구성은 다루지 않는다.

## 참고 자료
${sources.length
  ? sources.map((s, i) => `[${i + 1}] ${s.title} (${s.url})\n${s.snippet}`).join('\n\n')
  : '(참고 자료 없음. unsupported와 code 판정만 사용한다)'}

## 리서치 요약
${state.researchData?.summary ?? '(없음)'}

## 검증할 글
${state.finalContent}

다음 JSON만 반환하세요:

{
  "statements": [
    { "text": "글의 문장", "evidence": "자료에서 그대로 옮긴 문장 또는 null", "source": 1, "verdict": "ok | contradicted | unsupported", "knowledge": "agrees | disagrees | unsure" }
  ],
  "calls": [
    { "call": "호출식", "verdict": "ok | wrong | unsure", "basis": "source | knowledge", "note": "wrong이나 unsure일 때 이유" }
  ],
  "summary": "검증 결과를 한두 문장으로",
  "issues": [
    {
      "claim": "글에서 그대로 옮긴 문장 (80자 이내)",
      "verdict": "contradicted | unsupported | code",
      "severity": "high | medium | low",
      "problem": "무엇이 왜 문제인지",
      "suggestion": "어떻게 고치면 되는지",
      "source": 3
    }
  ]
}
`;

    const response = await gemini.invoke(prompt);
    const factCheckResult = parseFactCheck(response.content.toString());

    const high = factCheckResult.issues.filter((i) => i.severity === 'high').length;
    onProgress?.({
      step: 'fact_check',
      status: 'completed',
      message: factCheckResult.issues.length
        ? `정확도 검증 완료: 주장 ${factCheckResult.checkedClaims ?? '?'}건 대조, 확인 필요 ${factCheckResult.issues.length}건 (높음 ${high}건)`
        : `정확도 검증 완료: 주장 ${factCheckResult.checkedClaims ?? '?'}건 대조, 자료와 어긋나는 내용을 찾지 못했습니다`,
      data: { factCheckResult },
    });

    return { factCheckResult, currentStep: 'fact_check_completed', progress: 62 };
  } catch (error) {
    // 참고용 단계라 실패해도 진행한다. 이전 라운드 결과가 새 본문에 잘못 붙지 않게 비운다
    onProgress?.({
      step: 'fact_check',
      status: 'completed',
      message: `정확도 검증을 건너뜁니다: ${error instanceof Error ? error.message : String(error)}`,
    });
    return { factCheckResult: undefined, currentStep: 'fact_check_skipped' };
  }
}
