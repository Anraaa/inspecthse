import { Toaster as SonnerToaster } from "sonner";

export function ToastProvider() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          fontSize: "14px",
        },
      }}
      richColors
      closeButton
      theme="light"
    />
  );
}
