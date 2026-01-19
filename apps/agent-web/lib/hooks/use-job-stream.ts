"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SSEEvent, JobStatus } from "@/lib/types";

interface UseJobStreamOptions {
  onProgress?: (event: SSEEvent) => void;
  onComplete?: (event: SSEEvent) => void;
  onError?: (event: SSEEvent) => void;
  onReviewRequired?: (event: SSEEvent) => void;
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

  const { onProgress, onComplete, onError, onReviewRequired } = options;

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const connect = useCallback(() => {
    if (!jobId) return;

    // Close existing connection
    disconnect();

    const eventSource = new EventSource(`/api/jobs/${jobId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);
        setEvents((prev) => [...prev, data]);

        switch (data.type) {
          case "progress":
            setCurrentStep(data.step);
            setProgress(data.progress);
            setStatus(data.status as JobStatus);
            onProgress?.(data);
            break;

          case "review-required":
            setStatus("human_review");
            onReviewRequired?.(data);
            break;

          case "complete":
            setStatus("completed");
            setProgress(100);
            onComplete?.(data);
            disconnect();
            break;

          case "error":
            setStatus("failed");
            setError(data.message);
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
      setError("Connection lost. Attempting to reconnect...");

      // Auto-reconnect after 3 seconds
      setTimeout(() => {
        if (eventSourceRef.current === eventSource) {
          connect();
        }
      }, 3000);
    };
  }, [jobId, disconnect, onProgress, onComplete, onError, onReviewRequired]);

  // Auto-connect when jobId changes
  useEffect(() => {
    if (jobId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [jobId, connect, disconnect]);

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
