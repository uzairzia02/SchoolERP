"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { X, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface UploadedFile {
  url: string;
  name: string;
}

interface FileUploadProps {
  endpoint: "assignmentAttachment" | "examAttachment" | "imageUploader";
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
}

export function FileUpload({ endpoint, value, onChange, maxFiles = 5 }: FileUploadProps) {
  function removeFile(url: string) {
    onChange(value.filter((f) => f.url !== url));
  }

  const isImage = (name: string) => /\.(jpg|jpeg|png|webp|gif)$/i.test(name);

  return (
    <div className="space-y-3">
      {value.length < maxFiles && (
        <UploadDropzone
          endpoint={endpoint}
          onClientUploadComplete={(res) => {
            const newFiles = res.map((f) => ({ url: f.url, name: f.name }));
            onChange([...value, ...newFiles]);
            toast.success(`${newFiles.length} file(s) uploaded`);
          }}
          onUploadError={(error: Error) => {
            toast.error(`Upload failed: ${error.message}`);
          }}
          className="ut-label:text-sm ut-allowed-content:text-xs ut-button:bg-primary ut-button:text-primary-foreground border-dashed"
        />
      )}

      {value.length > 0 && (
        <div className="space-y-1.5">
          {value.map((file) => (
            <div
              key={file.url}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm bg-muted/30"
            >
              <div className="flex items-center gap-2 truncate">
                {isImage(file.name) ? (
                  <ImageIcon className="h-4 w-4 text-blue-600 shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-purple-600 shrink-0" />
                )}
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:underline"
                >
                  {file.name}
                </a>
              </div>
              <button type="button" onClick={() => removeFile(file.url)} className="shrink-0">
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
