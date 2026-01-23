"use client";

interface SEOItem {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
}

interface SEOChecklistContentProps {
  reviewResult?: {
    seoScore?: number;
    techScore?: number;
    suggestions?: string[];
    issues?: string[];
    seoChecks?: {
      titleLength?: boolean;
      summaryLength?: boolean;
      keywordsPresent?: boolean;
      headingStructure?: boolean;
      internalLinks?: boolean;
    };
  };
  metadata?: {
    title?: string;
    summary?: string;
    keywords?: string[];
    tags?: string[];
  };
}

export function SEOChecklistContent({
  reviewResult,
  metadata,
}: SEOChecklistContentProps) {
  // SEO 체크리스트 항목 생성
  const generateSEOItems = (): SEOItem[] => {
    const items: SEOItem[] = [];

    // 제목 길이 체크 (30-60자 권장)
    const titleLength = metadata?.title?.length || 0;
    items.push({
      id: "title-length",
      label: "제목 길이",
      passed: titleLength >= 30 && titleLength <= 60,
      detail: `${titleLength}자 (권장: 30-60자)`,
    });

    // 요약 길이 체크 (50-150자 권장)
    const summaryLength = metadata?.summary?.length || 0;
    items.push({
      id: "summary-length",
      label: "요약 길이",
      passed: summaryLength >= 50 && summaryLength <= 150,
      detail: `${summaryLength}자 (권장: 50-150자)`,
    });

    // 키워드 존재 여부
    const hasKeywords = (metadata?.keywords?.length || 0) >= 3;
    items.push({
      id: "keywords",
      label: "키워드 개수",
      passed: hasKeywords,
      detail: `${metadata?.keywords?.length || 0}개 (권장: 3개 이상)`,
    });

    // 태그 존재 여부
    const hasTags = (metadata?.tags?.length || 0) >= 3;
    items.push({
      id: "tags",
      label: "태그 개수",
      passed: hasTags,
      detail: `${metadata?.tags?.length || 0}개 (권장: 3-5개)`,
    });

    // reviewResult의 seoChecks 사용
    if (reviewResult?.seoChecks) {
      if (reviewResult.seoChecks.headingStructure !== undefined) {
        items.push({
          id: "heading-structure",
          label: "헤딩 구조",
          passed: reviewResult.seoChecks.headingStructure,
          detail: reviewResult.seoChecks.headingStructure
            ? "H1-H6 구조 적절함"
            : "헤딩 구조 개선 필요",
        });
      }

      if (reviewResult.seoChecks.internalLinks !== undefined) {
        items.push({
          id: "internal-links",
          label: "내부 링크",
          passed: reviewResult.seoChecks.internalLinks,
          detail: reviewResult.seoChecks.internalLinks
            ? "내부 링크 포함됨"
            : "내부 링크 추가 권장",
        });
      }
    }

    return items;
  };

  const seoItems = generateSEOItems();
  const passedCount = seoItems.filter((item) => item.passed).length;
  const totalCount = seoItems.length;
  const percentage = Math.round((passedCount / totalCount) * 100);

  // 점수에 따른 색상
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-4">
      {/* 점수 요약 */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <span className="text-sm font-medium">SEO 점수</span>
        <span className={`text-lg font-bold ${getScoreColor(percentage)}`}>
          {percentage}%
        </span>
      </div>

      {/* AI 리뷰 점수 (있는 경우) */}
      {reviewResult && (
        <div className="flex gap-4 text-sm">
          {reviewResult.seoScore !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">AI SEO:</span>
              <span className={`font-medium ${getScoreColor(reviewResult.seoScore)}`}>
                {reviewResult.seoScore}점
              </span>
            </div>
          )}
          {reviewResult.techScore !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">기술:</span>
              <span className={`font-medium ${getScoreColor(reviewResult.techScore)}`}>
                {reviewResult.techScore}점
              </span>
            </div>
          )}
        </div>
      )}

      {/* 체크리스트 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">체크리스트</h4>
        <ul className="space-y-1.5">
          {seoItems.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-2 text-sm"
            >
              <span className={item.passed ? "text-green-500" : "text-red-500"}>
                {item.passed ? "✓" : "✗"}
              </span>
              <div className="flex-1">
                <span className={item.passed ? "text-foreground" : "text-muted-foreground"}>
                  {item.label}
                </span>
                {item.detail && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({item.detail})
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 개선 제안 (있는 경우) */}
      {reviewResult?.suggestions && reviewResult.suggestions.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <h4 className="text-sm font-medium text-muted-foreground">개선 제안</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {reviewResult.suggestions.slice(0, 3).map((suggestion, index) => (
              <li key={index} className="flex items-start gap-1">
                <span>•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 이슈 (있는 경우) */}
      {reviewResult?.issues && reviewResult.issues.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <h4 className="text-sm font-medium text-red-500">주의 사항</h4>
          <ul className="space-y-1 text-xs text-red-400">
            {reviewResult.issues.slice(0, 3).map((issue, index) => (
              <li key={index} className="flex items-start gap-1">
                <span>!</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
