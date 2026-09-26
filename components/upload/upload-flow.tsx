"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/upload/dropzone";
import { FilePreview } from "@/components/upload/file-preview";
import { ProcessingSteps } from "@/components/upload/processing-steps";
import { isAcceptedFile } from "@/lib/validation/file";
import { trackClientEvent } from "@/lib/analytics/events";

type Status = "idle" | "processing" | "failed";

const INVALID_FILE_ERROR = "This file can't be uploaded. Check the file type and size.";
const UPLOAD_FAILED_ERROR = "Upload failed. Please try again.";
/** Exact string required by authentiation-security.md §4. */
const PROCESSING_FAILED_ERROR = "We couldn't finish analyzing this document.";
const POLL_INTERVAL_MS = 2000;

interface DocumentStatus {
  processingStatus: "uploaded" | "processing" | "ready" | "failed";
  processingError: string | null;
  caseId: string | null;
}

export function UploadFlow({ userId }: { userId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Polls the pipeline Feature 09 starts after upload. `ready` won't happen
  // until Feature 10 (AI analysis) exists to create the case and flip the
  // status — this poll is correct and just waits until then.
  useEffect(() => {
    if (status !== "processing" || !documentId) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/documents/${documentId}`);
        if (!res.ok || cancelled) return;
        const body: DocumentStatus = await res.json();

        if (body.processingStatus === "failed") {
          setError(body.processingError ?? PROCESSING_FAILED_ERROR);
          setStatus("failed");
          return;
        }
        if (body.processingStatus === "ready" && body.caseId) {
          router.push(`/cases/${body.caseId}`);
          return;
        }
      } catch {
        // Transient network hiccup — keep polling rather than failing the page.
      }
      if (!cancelled) timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
    }

    let timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [status, documentId, router]);

  function handleFileSelected(selected: File) {
    if (!isAcceptedFile(selected)) {
      setError(INVALID_FILE_ERROR);
      setFile(null);
      setIdempotencyKey(null);
      return;
    }
    setError(null);
    setFile(selected);
    setIdempotencyKey(crypto.randomUUID());
  }

  function handleRemove() {
    setFile(null);
    setIdempotencyKey(null);
    setError(null);
  }

  async function handleUpload() {
    if (!file || !idempotencyKey) return;
    setError(null);
    if (!navigator.onLine) {
      setError(UPLOAD_FAILED_ERROR);
      setStatus("failed");
      return;
    }

    trackClientEvent("document_upload_started", { userId });
    setStatus("processing");
    setStep(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("idempotencyKey", idempotencyKey);
      const res = await fetch("/api/documents", { method: "POST", body: formData });
      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setError(body?.error ?? UPLOAD_FAILED_ERROR);
        setStatus("failed");
        return;
      }

      trackClientEvent("document_uploaded", {
        userId,
        fileType: body.mimeType,
        pageCount: body.pageCount,
      });
      setDocumentId(body.id);
      // Upload step done; the pipeline's own stages (parse/OCR, and once
      // Feature 10 exists, AI analysis) aren't individually observable yet,
      // so the remaining steps stay at "Reading document" until it resolves.
      setStep(1);

      if (body.processingStatus === "failed") {
        setError(PROCESSING_FAILED_ERROR);
        setStatus("failed");
      }
    } catch {
      setError(UPLOAD_FAILED_ERROR);
      setStatus("failed");
    }
  }

  async function handleRetry() {
    setError(null);
    if (!documentId) {
      // The original upload request itself never created a document — let
      // the user re-submit the same file/idempotency key from scratch.
      setStatus("idle");
      return;
    }
    setStatus("processing");
    setStep(1);
    try {
      const res = await fetch(`/api/documents/${documentId}`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok || body?.processingStatus === "failed") {
        setError(PROCESSING_FAILED_ERROR);
        setStatus("failed");
      }
    } catch {
      setError(PROCESSING_FAILED_ERROR);
      setStatus("failed");
    }
  }

  return (
    <section className="bg-white text-black py-12 md:py-24 px-4 md:px-8 lg:px-12">
      <div className="max-w-2xl mx-auto flex flex-col gap-6 md:gap-8">
        <div>
          <h1 className="font-black tracking-tight text-3xl md:text-5xl">Upload Document</h1>
          <p className="font-mono text-sm md:text-base mt-2 text-black/80">
            Upload a government letter, insurance notice, medical bill, or any confusing
            document. bujhAI will explain what it is and build you an action plan.
          </p>
        </div>

        {error && (
          <div className="rounded-none border-2 border-black bg-[#ff006e] text-white font-mono text-xs md:text-sm px-3 py-2 md:px-4 md:py-3">
            {error}
          </div>
        )}

        {status === "idle" && (
          <>
            {!file && <Dropzone onFileSelected={handleFileSelected} />}
            {file && (
              <>
                <FilePreview file={file} onRemove={handleRemove} />
                <Button onClick={handleUpload} className="w-full">
                  Upload
                </Button>
              </>
            )}
          </>
        )}

        {status === "processing" && <ProcessingSteps currentStep={step} />}

        {status === "failed" && (
          <Button onClick={handleRetry} variant="secondary" className="w-full">
            {documentId ? "Retry" : "Try Again"}
          </Button>
        )}
      </div>
    </section>
  );
}
