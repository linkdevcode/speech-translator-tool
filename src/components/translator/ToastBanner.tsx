interface ToastBannerProps {
  message: string | null;
}

export function ToastBanner({ message }: ToastBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900"
    >
      {message}
    </p>
  );
}
