import { NextRequest, NextResponse } from "next/server";

import { log } from "@/lib/observability/log";
import { createAdminClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_TOTAL_UPLOAD = 100 * 1024 * 1024; // 100 MB total request body
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  try {
    // Pre-check Content-Length BEFORE reading the body so a 200 MB
    // request doesn't get fully buffered into RAM before we reject it.
    const contentLength = request.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_TOTAL_UPLOAD) {
      return NextResponse.json(
        { error: `Upload too large. Max total size: 100MB` },
        { status: 413 },
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Validate all files before uploading
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Allowed: PNG, JPG, WEBP, GIF` },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Max size: 5MB` },
          { status: 400 },
        );
      }
    }

    const supabase = createAdminClient();
    const urls: string[] = [];

    for (const file of files) {
      const ext = file.type.split("/")[1] || "webp";
      const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const buffer = await file.arrayBuffer();

      const { error } = await supabase.storage.from("images").upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

      if (error) {
        return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
      }

      const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);

      urls.push(urlData.publicUrl);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    log.error("admin_upload_error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
