import React, { useRef, useState } from "react";
import { Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onUploadStart?: () => void;
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (file: File) => void;
  onError?: (error: string) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in bytes
  disabled?: boolean;
}

export default function FileUpload({
  onFileSelect,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onError,
  acceptedTypes = ["video/mp4", "application/pdf", "text/plain", "image/jpeg", "image/png"],
  maxSize = 100 * 1024 * 1024, // 100MB default
  disabled = false,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      const message = `Type de fichier non accepté. Types acceptés: ${acceptedTypes.join(", ")}`;
      setErrorMessage(message);
      onError?.(message);
      return false;
    }

    // Check file size
    if (file.size > maxSize) {
      const message = `Fichier trop volumineux. Taille maximale: ${(maxSize / 1024 / 1024).toFixed(0)}MB`;
      setErrorMessage(message);
      onError?.(message);
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (disabled) return;

    if (validateFile(file)) {
      setSelectedFile(file);
      setUploadStatus("idle");
      setErrorMessage("");
      onFileSelect(file);
    } else {
      setUploadStatus("error");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus("idle");
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="w-full space-y-4">
      {/* Drag and drop area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50",
          disabled && "opacity-50 cursor-not-allowed",
          uploadStatus === "error" && "border-destructive bg-destructive/5"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleInputChange}
          className="hidden"
          accept={acceptedTypes.join(",")}
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">Glissez-déposez votre fichier ici</p>
            <p className="text-xs text-muted-foreground">ou cliquez pour sélectionner</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Taille maximale: {(maxSize / 1024 / 1024).toFixed(0)}MB
          </p>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{errorMessage}</p>
        </div>
      )}

      {/* Selected file info */}
      {selectedFile && (
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>
            {uploadStatus === "success" && (
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
            )}
            {uploadStatus === "error" && (
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 ml-2" />
            )}
            {uploadStatus !== "success" && uploadStatus !== "error" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                disabled={isUploading}
                className="ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Téléversement en cours...</p>
                <p className="text-xs font-medium">{uploadProgress}%</p>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Status message */}
          {uploadStatus === "success" && (
            <p className="text-xs text-green-600">Fichier téléversé avec succès</p>
          )}
          {uploadStatus === "error" && (
            <p className="text-xs text-destructive">Erreur lors du téléversement</p>
          )}
        </div>
      )}
    </div>
  );
}
