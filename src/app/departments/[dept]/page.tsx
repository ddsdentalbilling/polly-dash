"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState, useRef } from "react";

const deptMeta: Record<string, { name: string; icon: string; phase: string; description: string }> = {
  operations: { name: "Operations", icon: "📋", phase: "Phase 1", description: "Service delivery, client coverage, process optimization, SOP management" },
  it: { name: "IT", icon: "💻", phase: "Phase 1", description: "Technology strategy, security, development, automation, business ops web app" },
  finance: { name: "Finance", icon: "💰", phase: "Phase 2", description: "Financial analysis, reporting, cost tracking, revenue optimization" },
  hr: { name: "HR", icon: "👥", phase: "Phase 2", description: "Compliance, performance management, employee development, policy" },
  "marketing-sales": { name: "Marketing & Sales", icon: "📢", phase: "Phase 2", description: "Marketing strategy, content creation, sales enablement, campaign management" },
};

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  type: string;
}

export default function DepartmentPage() {
  const params = useParams();
  const dept = params.dept as string;
  const meta = deptMeta[dept];
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch(`/api/files/${dept}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch {
      // ignore
    }
  }, [dept]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (fileList: FileList) => {
    setUploading(true);
    setMessage("");
    let uploaded = 0;

    for (const file of Array.from(fileList)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("department", dept);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) uploaded++;
      } catch {
        // ignore individual failures
      }
    }

    setUploading(false);
    setMessage(`✅ ${uploaded} file${uploaded !== 1 ? "s" : ""} uploaded`);
    fetchFiles();
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/files/${dept}/${fileId}/download`);
      if (res.ok) {
        const { url } = await res.json();
        window.open(url, "_blank");
      } else {
        alert("Could not download file. Please try again.");
      }
    } catch {
      alert("Error downloading file.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  if (!meta) {
    return <div className="text-center py-12 text-muted-foreground">Department not found.</div>;
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileIcon = (name: string) => {
    if (name.endsWith(".pdf")) return "📄";
    if (name.endsWith(".docx") || name.endsWith(".doc")) return "📝";
    if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) return "📊";
    if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")) return "🖼️";
    return "📎";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{meta.icon}</span>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{meta.name}</h1>
            <Badge>{meta.phase}</Badge>
          </div>
          <p className="text-muted-foreground">{meta.description}</p>
        </div>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Drag and drop files here for Polly to review. Supports .docx, .pdf, .xlsx, .csv, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.json,.png,.jpg,.jpeg"
            />
            <div className="text-4xl mb-3">{uploading ? "⏳" : "📁"}</div>
            <p className="text-lg font-medium">
              {uploading ? "Uploading..." : isDragging ? "Drop files here!" : "Drag & drop files or click to browse"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PDF, Word, Excel, CSV, images, and text files
            </p>
          </div>
          {message && (
            <p className="mt-3 text-sm text-green-500 font-medium">{message}</p>
          )}
        </CardContent>
      </Card>

      {/* File List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Uploaded Files</CardTitle>
              <CardDescription>{files.length} file{files.length !== 1 ? "s" : ""} in this department</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchFiles}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No files uploaded yet. Drop some files above to get started!
            </p>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors group">
                  <span className="text-xl">{fileIcon(file.name)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 mr-2">
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDownload(file.id, file.name)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ⬇️
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
