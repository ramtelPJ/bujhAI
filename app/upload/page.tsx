"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/upload/dropzone";
import { FilePreview } from "@/components/upload/file-preview";
import { ProcessingSteps } from "@/components/upload/processing-steps";
import { isAcceptedFile } from "@/lib/validation/file";

type Status = "idle" | "processing" | "failed";

const INVALID_FILE_ERROR = "This file can't be uploaded. Check the file type and size.";
const UPLOAD_FAILED_ERROR = "Upload failed. Please try again.";
const STEP_DELAY_MS = 900;

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelected(selected: File) {
    if (!isAcceptedFile(selected)) {
      setError(INVALID_FILE_ERROR);
      setFile(null);
      return;
    }
    setError(null);
    setFile(selected);
  }

  function handleRemove() {
    setFile(null);
    setError(null);
  }

  function handleUpload() {
    if (!file) return;
    setError(null);
    if (!navigator.onLine) {
      setStatus("failed");
      return;
    }
    setStatus("processing");
    setStep(0);
    // Mock progression only — Feature 07 replaces this with the real upload
    // request and Feature 09's processing-status polling.
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current >= 4) {
        clearInterval(interval);
        setStep(3);
        return;
      }
      setStep(current);
    }, STEP_DELAY_MS);
  }

  function handleRetry() {
    setStatus("idle");
    setError(null);
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
          <div className="flex flex-col gap-4">
            <div className="rounded-none border-2 border-black bg-[#ff006e] text-white font-mono text-xs md:text-sm px-3 py-2 md:px-4 md:py-3">
              {UPLOAD_FAILED_ERROR}
            </div>
            <Button onClick={handleRetry} variant="secondary" className="w-full">
              Try Again
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
