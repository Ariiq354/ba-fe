import { API_URL } from "~/constants";

export async function useUploadFile(
  file: File,
  dir: string,
) {
  // 1. Dapatkan presigned upload URL & pending file ID dari server
  const presigned = await $fetch<{ uploadUrl: string; key: string }>(`${API_URL}/api/v1/files/presigned`, {
    method: "POST",
    credentials: "include",
    body: {
      dir,
      filename: file.name,
      filesize: file.size,
      fileType: file.type || "application/octet-stream",
    },
  });

  // 2. Upload file langsung ke presigned PUT URL (S3 / Cloudflare R2)
  await $fetch(presigned.uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });

  return presigned.key;
}
