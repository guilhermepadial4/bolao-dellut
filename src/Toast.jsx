import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

export default function Toast({ message, type, show }) {
  if (!show) return null;

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  }[type];

  const Icon = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  }[type];

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg text-white font-bold flex items-center gap-3 z-50 transition-all duration-300 ${bgColor} ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      {Icon && <Icon size={24} />}
      <span>{message}</span>
    </div>
  );
}
