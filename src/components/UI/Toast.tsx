import { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  onUndo?: () => void;
  showUndo?: boolean;
  duration?: number;
}

export default function Toast({
  message,
  type,
  onClose,
  onUndo,
  showUndo = false,
  duration = 5000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColor = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
  }[type];

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <div
        className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 max-w-md`}
      >
        <span className="flex-1 text-sm font-medium">{message}</span>

        {showUndo && onUndo && (
          <button
            onClick={onUndo}
            className="text-white hover:text-gray-200 underline text-sm font-medium cursor-pointer"
          >
            Undo
          </button>
        )}

        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 cursor-pointer"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
