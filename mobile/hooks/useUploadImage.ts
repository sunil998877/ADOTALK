import { useMutation } from "@tanstack/react-query";
import { useApi } from "@/lib/axios";

export const useUploadImage = () => {
  const { apiWithAuth } = useApi();

  return useMutation({
    mutationFn: async (imageBase64: string) => {
      const { data } = await apiWithAuth<{ imageUrl: string }>({
        method: "POST",
        url: "/messages/upload-image",
        data: { image: imageBase64 },
      });
      return data.imageUrl;
    },
  });
};
