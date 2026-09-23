import { formatFileSize } from "@/lib/validation/file";

const TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
};

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-none border-2 md:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-4 md:p-6">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm md:text-base truncate">{file.name}</p>
        <p className="font-mono text-xs uppercase tracking-wider text-black/60 mt-1">
          {TYPE_LABELS[file.type] ?? file.type} · {formatFileSize(file.size)}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove file"
        className="shrink-0 rounded-none border-2 border-black bg-white font-black uppercase text-xs px-3 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#00d9ff] focus-visible:ring-offset-2"
      >
        Remove
      </button>
    </div>
  );
}
