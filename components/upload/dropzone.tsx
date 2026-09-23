"use client";

import { useRef, useState, type DragEvent } from "react";
import { ACCEPTED_FILE_EXTENSIONS, MAX_FILE_SIZE_MB } from "@/lib/validation/file";

interface DropzoneProps {
  onFileSelected: (file: File) => void;
}

export function Dropzone({ onFileSelected }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`cursor-pointer rounded-none border-2 md:border-4 border-black p-8 md:p-16 text-center transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#00d9ff] focus-visible:ring-offset-2 ${
        isDragOver ? "bg-[#ccff00]" : "bg-white"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_EXTENSIONS}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
          e.target.value = "";
        }}
      />
      <p className="font-black tracking-tight text-xl md:text-2xl">
        Drag and drop your file here
      </p>
      <p className="font-mono text-sm md:text-base mt-2 text-black/80">
        or click to browse
      </p>
      <p className="font-mono text-xs md:text-sm uppercase tracking-wider mt-6 text-black/60">
        PDF, JPG, or PNG — up to {MAX_FILE_SIZE_MB}MB
      </p>
    </div>
  );
}
