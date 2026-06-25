import { ImageIcon, SendIcon, XIcon } from "lucide-react";
import { useRef } from "react";

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  onImageSelect,
  pendingImage,
  onClearImage,
  isUploadingImage,
}) {
  const fileInputRef = useRef(null);

  return (
    <form onSubmit={onSubmit} className="border-t border-base-300 bg-base-200/80">
      {pendingImage ? (
        <div className="px-4 pt-3">
          <div className="relative inline-block">
            <img
              src={pendingImage}
              alt="Selected"
              className="h-20 w-20 rounded-xl object-cover border border-base-300"
            />
            {isUploadingImage ? (
              <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
                <span className="loading loading-spinner loading-sm text-amber-400" />
              </div>
            ) : (
              <button
                type="button"
                onClick={onClearImage}
                className="absolute -top-2 -right-2 btn btn-circle btn-xs bg-base-300 border-none"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3 p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImageSelect?.(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className="btn btn-ghost btn-square rounded-xl"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImage}
        >
          <ImageIcon className="size-5 text-amber-400" />
        </button>
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder="Type a message..."
          className="input input-bordered flex-1 rounded-xl bg-base-300/40 border-base-300 placeholder:text-base-content/60"
        />
        <button
          type="submit"
          disabled={disabled && !pendingImage}
          className="btn rounded-xl bg-linear-to-r from-amber-500 to-orange-500 border-none disabled:btn-disabled"
        >
          <SendIcon className="size-5" />
        </button>
      </div>
    </form>
  );
}
