"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SSEEvent, JobStatus } from "@/lib/types";

interface UseJobStreamOptions {
  onProgress?: (event: SSEEvent) => void;
  onComplete?: (event: SSEEvent) => void;
  onError?: (event: SSEEvent) => void;
  onReviewRequired?: (event: SSEEvent) => void;
  onPendingDeploy?: (event: SSEEvent) => void;
}

interface UseJobStreamReturn {
  isConnected: boolean;
  events: SSEEvent[];
  currentStep: string | null;
  progress: number;
  status: JobStatus | null;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

export function useJobStream(
  jobId: string | null,
  options: UseJobStreamOptions = {}
): UseJobStreamReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isTerminatedRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const { onProgress, onComplete, onError, onReviewRequired, onPendingDeploy } = options;

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const connect = useCallback(() => {
    if (!jobId || isTerminatedRef.current) return;

    // Close existing connection
    disconnect();

    const eventSource = new EventSource(`/api/jobs/${jobId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);
        setEvents((prev) => [...prev, data]);

        switch (data.type) {
          case "progress": {
            setCurrentStep(data.step);
            setProgress(data.progress);

            const newStatus = data.status as JobStatus;
            const currentStep = data.step;

            // step 기반으로 상태 결정 (status보다 step이 더 정확함)
            // human_review, pending_deploy step이면 해당 상태로 설정
            // 그 외의 step(write, review 등)이면 해당 status 사용
            setStatus((prev) => {
              const specialStatuses: JobStatus[] = ["human_review", "pending_deploy"];

              // step이 특수 상태면 해당 상태로 설정
              if (currentStep === "human_review") {
                return "human_review";
              }
              if (currentStep === "pending_deploy") {
                return "pending_deploy";
              }

              // step이 일반 상태(write, review 등)면 status 사용
              // 이전이 특수 상태여도 현재 step이 일반이면 변경 허용 (workflow 진행 중)
              return newStatus;
            });

            // progress 이벤트에서도 status가 특수 상태면 해당 콜백 호출
            // (review-required/pending-deploy 이벤트가 누락된 경우를 대비)
            if (newStatus === "human_review" || currentStep === "human_review") {
              onReviewRequired?.(data as unknown as SSEEvent);
            } else if (newStatus === "pending_deploy" || currentStep === "pending_deploy") {
              onPendingDeploy?.(data as unknown as SSEEvent);
            }

            onProgress?.(data);
            break;
          }

          case "review-required":
            setStatus("human_review");
            onReviewRequired?.(data);
            break;

          case "pending-deploy":
            setStatus("pending_deploy");
            onPendingDeploy?.(data);
            break;

          case "complete":
            setStatus("completed");
            setProgress(100);
            isTerminatedRef.current = true;
            onComplete?.(data);
            disconnect();
            break;

          case "error":
            setStatus("failed");
            setError(data.message);
            isTerminatedRef.current = true;
            onError?.(data);
            disconnect();
            break;
        }
      } catch (err) {
        console.error("Failed to parse SSE event:", err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);

      // Don't reconnect if terminated or max attempts reached
      if (isTerminatedRef.current || reconnectAttemptsRef.current >= 3) {
        disconnect();
        return;
      }

      reconnectAttemptsRef.current += 1;
      setError(`Connection lost. Reconnecting... (${reconnectAttemptsRef.current}/3)`);

      // Reconnect with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isTerminatedRef.current && eventSourceRef.current === eventSource) {
          connect();
        }
      }, delay);
    };
  }, [jobId, disconnect, onProgress, onComplete, onError, onReviewRequired, onPendingDeploy]);

  // Auto-connect when jobId changes
  useEffect(() => {
    // Reset terminated state for new job
    isTerminatedRef.current = false;
    reconnectAttemptsRef.current = 0;

    if (jobId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [jobId]); // Only depend on jobId, not connect/disconnect

  return {
    isConnected,
    events,
    currentStep,
    progress,
    status,
    error,
    connect,
    disconnect,
  };
}
