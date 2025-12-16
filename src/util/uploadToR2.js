export const uploadImageToR2 = async (file) => {
  const res = await fetch("/api/upload/presigned-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
    }),
  });

  const { uploadUrl, fileUrl } = await res.json();

  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  return fileUrl;
};
