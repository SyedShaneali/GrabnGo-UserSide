import { useState } from "react";
import axiosClient from "../api/axiosClient";

// Fixed: the backend's real response shape is { uploads: [...] }.
// The old fallback chain (data.urls || data.data || data.result || data)
// never checked data.uploads, so it fell through to the whole response
// object instead of the array inside it — that's why normalizePresignItem
// couldn't find url/key fields (they were one level deeper).
async function presignUpload(filenames) {
  const { data } = await axiosClient.post(`/attachment/presign`, { filenames });
  return data.uploads || data.urls || data.data || data.result || data;
}

function normalizePresignItem(item) {
  return {
    putUrl: item.url || item.upload_url || item.presigned_url || item.presignedUrl,
    key: item.key || item.file_key || item.path || item.filename,
  };
}

// This one stays a raw fetch on purpose — it's a PUT straight to the
// presigned storage URL, not your API host, so it shouldn't go through
// axiosClient's baseURL/interceptors.
async function putFile(file, putUrl) {
  const res = await fetch(putUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!res.ok) throw new Error(`Upload failed for "${file.name}"`);
}

export function useFileUploader() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadFiles = async (files) => {
    if (!files || files.length === 0) return [];
    setUploading(true);
    setError(null);
    try {
      const rawItems = await presignUpload(files.map((f) => f.name));
      const items = Array.isArray(rawItems) ? rawItems : [rawItems];

      const uploaded = [];
      for (let i = 0; i < files.length; i++) {
        const { putUrl, key } = normalizePresignItem(items[i] || {});
        if (!putUrl || !key) {
          throw new Error(
            "Presign response didn't have the fields I expected — check normalizePresignItem() in useCreateOrder.js"
          );
        }
        await putFile(files[i], putUrl);
        uploaded.push({
          key,
          name: files[i].name,
          previewUrl: URL.createObjectURL(files[i]),
        });
      }
      return uploaded;
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Upload failed");
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFiles, uploading, error };
}

export function useSubmitOrder() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submitOrder = async (payload) => {
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await axiosClient.post(`/order/`, payload);
      return data;
    } catch (err) {
      const message =
        err?.response?.data?.detail || err?.response?.data?.message || "Failed to create order";
      setError(message);
      throw new Error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return { submitOrder, submitting, error };
}