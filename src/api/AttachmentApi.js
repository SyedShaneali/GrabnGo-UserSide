// api/attachmentApi.js
import axiosClient from "./axiosClient";

// POST /attachment/presign — confirmed real shape: { uploads: [...] }.
// Kept the same broad field-name fallbacks as useCreateOrder.js's
// useFileUploader (url/upload_url/presigned_url/presignedUrl,
// key/file_key/path/filename) since the raw item shape isn't guaranteed
// to be identical between order attachments and chat attachments.
//
// IMPORTANT: match presign results to files by ARRAY INDEX, not by a
// `filename` field on the response item — per useCreateOrder.js, the
// backend doesn't reliably echo the filename back, it just returns
// uploads in the same order the filenames were sent in.
export const presignAttachmentsApi = async (filenames) => {
  const { data } = await axiosClient.post("/attachment/presign", { filenames });
  const raw = data?.uploads ?? data?.urls ?? data?.data ?? data?.result ?? data;
  const items = Array.isArray(raw) ? raw : [raw];

  const uploads = items.map((item, i) => ({
    filename:   filenames[i], // ours, not the backend's — index-matched
    upload_url: item?.url ?? item?.upload_url ?? item?.presigned_url ?? item?.presignedUrl,
    key:        item?.key ?? item?.file_key ?? item?.path ?? item?.filename ?? filenames[i],
  }));

  return { uploads };
};

// XHR (not fetch) so we can report real upload progress back to the caller
// — drives the per-attachment progress ring/bar in the chat UI. Still a
// raw PUT straight to the presigned storage URL, same as putFile() in
// useCreateOrder.js — no axiosClient, no auth headers, no baseURL.
export const uploadFileToPresignedUrl = (uploadUrl, file, onProgress) => {
  return new Promise((resolve, reject) => {
    if (!uploadUrl) {
      reject(new Error(`No presigned URL for "${file.name}"`));
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(`Upload failed for "${file.name}"`));
      }
    };
    xhr.onerror = () => reject(new Error(`Upload failed for "${file.name}"`));
    xhr.send(file);
  });
};