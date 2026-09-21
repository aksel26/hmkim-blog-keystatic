"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { formatDate } from "@/lib/utils";
import type { TrendsResponse, TrendKeyword, TrendSource, NaverCategory } from "@/lib/trends/types";
import { NAVER_CATEGORIES } from "@/lib/trends/types";

// 검색엔진은 로고 대신 색을 입힌 이름으로 구분한다
function SourceLabel({ source }: { source: TrendSource }) {
  return (
    <span
      className={`text-[11px] font-semibold uppercase tracking-wide ${
        source === "google" ? "text-pencil" : "text-success"
      }`}
    >
      {source}
    </span>
  );
}

function groupByRank(keywords: TrendKeyword[]): Map<number, TrendKeyword[]> {
  const groups = new Map<number, TrendKeyword[]>();
  for (const kw of keywords) {
    const list = groups.get(kw.rank);
    if (list) {
      list.push(kw);
    } else {
      groups.set(kw.rank, [kw]);
    }
  }
  return groups;
}

const sourceOptions = [
  { value: "google,naver", label: "Google + Naver" },
  { value: "google", label: "Google" },
  { value: "naver", label: "Naver" },
];

const countryOptions = [
  { value: "KR", label: "한국" },
  { value: "US", label: "미국" },
  { value: "JP", label: "일본" },
];

const timeframeOptions = [
  { value: "4h", label: "최근 4시간" },
  { value: "24h", label: "최근 24시간" },
  { value: "7d", label: "최근 7일" },
  { value: "30d", label: "최근 30일" },
];

const naverCategoryEntries = Object.entries(NAVER_CATEGORIES) as [NaverCategory, string][];

async function fetchTrends(params: {
  sources: string;
  country: string;
  timeframe: string;
  limit: number;
  naverCategories?: string;
}): Promise<TrendsResponse> {
  const searchParams = new URLSearchParams({
    sources: params.sources,
    country: params.country,
    timeframe: params.timeframe,
    limit: params.limit.toString(),
  });
  if (params.naverCategories) {
    searchParams.set("naverCategories", params.naverCategories);
  }
  const res = await fetch(`/api/trends?${searchParams}`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "트렌드 조회에 실패했습니다");
  }
  return res.json();
}

export default function TrendsPage() {
  const [sources, setSources] = useState("google,naver");
  const [country, setCountry] = useState("KR");
  const naverOnly = sources === "naver";
  const naverSelected = sources.includes("naver");
  const [timeframe, setTimeframe] = useState("24h");
  const [limit, setLimit] = useState(20);
  const [naverCategories, setNaverCategories] = useState<NaverCategory[]>([]);
  const [queryParams, setQueryParams] = useState<{
    sources: string;
    country: string;
    timeframe: string;
    limit: number;
    naverCategories?: string;
  } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["trends", queryParams],
    queryFn: () => fetchTrends(queryParams!),
    enabled: !!queryParams,
  });

  function toggleNaverCategory(cat: NaverCategory) {
    setNaverCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  function handleSearch() {
    setQueryParams({
      sources,
      country,
      timeframe,
      limit,
      naverCategories: naverSelected && naverCategories.length > 0 ? naverCategories.join(",") : undefined,
    });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="트렌드 키워드"
        description="Google과 Naver의 실시간 인기 검색어를 조회합니다"
      />

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-start gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">검색엔진</label>
              <NativeSelect
                options={sourceOptions}
                value={sources}
                onChange={(e) => setSources(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <label className="text-sm font-medium">국가</label>
                {sources !== "google" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="text-xs text-pencil hover:underline">
                        안내
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" className="w-auto px-3 py-2 text-xs text-muted-foreground">
                      Naver는 한국 데이터만 제공하여 국가 설정이 적용되지 않습니다.
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <NativeSelect
                options={countryOptions}
                value={naverOnly ? "KR" : country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-28"
                disabled={naverOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">기간</label>
              <NativeSelect
                options={timeframeOptions}
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-36"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">개수</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value) || 20)}
                className="w-20"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading} className="mt-[26px]">
              {isLoading ? "조회 중…" : "조회"}
            </Button>
          </div>

          {/* Naver 관심사 필터 */}
          {naverSelected && (
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <span className="shrink-0 text-sm font-medium">
                  <span className="text-success">Naver</span> 관심사
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {naverCategoryEntries.map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleNaverCategory(key)}
                      className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                        naverCategories.includes(key)
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "shadow-border text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  {naverCategories.length === 0 && (
                    <span className="text-xs text-muted-foreground ml-1">전체 (미선택 시 전체 조회)</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partial failure warning */}
      {data?.meta.partial && data.errors.length > 0 && (
        <div className="p-4 bg-warning/10 rounded-md">
          <div>
            <p className="text-sm font-semibold text-warning">
              일부 소스에서 오류가 발생했습니다
            </p>
            {data.errors.map((err, i) => (
              <p key={i} className="text-xs text-muted-foreground mt-0.5">
                [{err.source}] {err.message} ({err.code})
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>
            {data ? `${data.keywords.length}개 키워드` : "키워드 조회 결과"}
          </CardTitle>
          {data?.meta.cacheHit && (
            <Badge variant="outline" className="text-xs">
              캐시 데이터
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={10} cols={5} />
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive text-sm">
                {error instanceof Error
                  ? error.message
                  : "트렌드 조회에 실패했습니다"}
              </p>
            </div>
          ) : !data || !queryParams ? (
            <EmptyState
              title="트렌드 키워드 조회"
              description="필터를 설정하고 '조회' 버튼을 클릭하세요"
            />
          ) : data.keywords.length === 0 ? (
            <EmptyState
              title="결과 없음"
              description="조건에 맞는 트렌드 키워드가 없습니다"
            />
          ) : (
            <div className="-mx-2 divide-y divide-border/70">
              {/* Table header */}
              <div className="flex items-center gap-4 px-2 py-2 text-xs font-semibold text-muted-foreground">
                <span className="w-12">순위</span>
                <span className="flex-1">키워드</span>
                <span className="w-28">검색엔진</span>
                <span className="w-20 text-right">검색량</span>
                <span className="w-36 text-right">수집 시각</span>
              </div>
              {/* Rows grouped by rank */}
              {Array.from(groupByRank(data.keywords)).map(
                ([rank, items]) => (
                  <div key={rank} className={items.length > 1 ? "bg-background/60" : ""}>
                    {items.map((kw, i) => (
                      <div
                        key={`${kw.keyword}-${i}`}
                        className="flex items-center gap-4 px-2 py-2.5"
                      >
                        {i === 0 ? (
                          <span className={`w-12 text-xl font-bold tabular-nums ${rank <= 3 ? "text-pencil" : "text-muted-foreground"}`}>
                            {rank}
                          </span>
                        ) : (
                          <span className="w-12" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-base font-semibold">{kw.keyword}</span>
                          {kw.related && kw.related.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {kw.related.slice(0, 3).map((r) => (
                                <a
                                  key={r.url}
                                  href={r.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-[11px] text-muted-foreground hover:text-pencil bg-background rounded-sm px-1.5 py-0.5 transition-colors"
                                >
                                  <span className="max-w-[200px] truncate">
                                    {r.title}
                                  </span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="w-28 flex items-center gap-2">
                          {kw.source.map((s) => (
                            <SourceLabel key={s} source={s} />
                          ))}
                        </div>
                        <span className="w-20 text-right text-sm tabular-nums text-muted-foreground">
                          {kw.score != null
                            ? kw.score.toLocaleString()
                            : "-"}
                        </span>
                        <span className="w-36 text-right text-xs text-muted-foreground">
                          {formatDate(kw.fetchedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
