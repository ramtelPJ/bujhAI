import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { withUser } from "@/lib/db/withUser";
import { uploadPrivateFile, deletePrivateFile } from "@/lib/storage";
import { isAcceptedFile } from "@/lib/validation/file";
import { getPageCount } from "@/lib/documents/pageCount";
import { trackServerEvent } from "@/lib/analytics/server-events";
import { AUTH_ERRORS } from "@/lib/auth/errors";
import { startProcessing } from "@/lib/documents/start-processing";

const INVALID_FILE_ERROR = "This file can't be uploaded. Check the file type and size.";
const UPLOAD_FAILED_ERROR = "Upload failed. Please try again.";

function toResponse(document: {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  pageCount: number | null;
  processingStatus: string;
}) {
  return {
    id: document.id,
    fileName: document.fileName,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    pageCount: document.pageCount,
    processingStatus: document.processingStatus,
  };
}

async function createAndStartProcessing(params: {
  userId: string;
  fileName: string;
  mimeType: string;
  blobPath: string;
  fileSize: number;
  pageCount: number;
  idempotencyKey: string;
}) {
  const document = await withUser(params.userId, (tx) =>
    tx.document.create({
      data: {
        userId: params.userId,
        fileName: params.fileName,
        mimeType: params.mimeType,
        blobPath: params.blobPath,
        fileSize: params.fileSize,
        pageCount: params.pageCount,
        idempotencyKey: params.idempotencyKey,
      },
    }),
  );
  const processingStatus = await startProcessing(document.id, params.userId);
  return { ...document, processingStatus };
}

export async function POST(request: Request) {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    return NextResponse.json({ error: AUTH_ERRORS.unauthenticated }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const idempotencyKey = formData.get("idempotencyKey");

  if (!(file instanceof File) || typeof idempotencyKey !== "string" || !idempotencyKey) {
    return NextResponse.json({ error: INVALID_FILE_ERROR }, { status: 400 });
  }

  if (!isAcceptedFile(file)) {
    return NextResponse.json({ error: INVALID_FILE_ERROR }, { status: 400 });
  }

  // Idempotency: a retried/duplicated request for the same attempt returns
  // the row already created instead of uploading/inserting again. RLS scopes
  // this lookup to the current user automatically.
  const existing = await withUser(user.id, (tx) => tx.document.findUnique({ where: { idempotencyKey } }));
  if (existing) {
    return NextResponse.json(toResponse(existing));
  }

  let pageCount: number;
  try {
    pageCount = await getPageCount(file);
  } catch {
    return NextResponse.json({ error: INVALID_FILE_ERROR }, { status: 400 });
  }

  let blobPath: string | null = null;
  try {
    const path = await uploadPrivateFile(`documents/${user.id}/${file.name}`, file, file.type);
    blobPath = path;
    const document = await createAndStartProcessing({
      userId: user.id,
      fileName: file.name,
      mimeType: file.type,
      blobPath: path,
      fileSize: file.size,
      pageCount,
      idempotencyKey,
    });
    trackServerEvent("document_uploaded", { userId: user.id, fileType: document.mimeType, pageCount });
    return NextResponse.json(toResponse(document));
  } catch {
    if (blobPath) await deletePrivateFile(blobPath).catch(() => {});
    return NextResponse.json({ error: UPLOAD_FAILED_ERROR }, { status: 500 });
  }
}
