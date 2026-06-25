import { useMutation } from "@tanstack/react-query";
import api from "../lib/axios";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file) => {
      const image = await fileToBase64(file);
      const res = await api.post("/messages/upload-image", { image });
      return res.data.imageUrl;
    },
  });
}
