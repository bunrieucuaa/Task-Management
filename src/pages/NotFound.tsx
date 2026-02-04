import { Link } from "@tanstack/react-router";
import { LucideAlertCircle } from "lucide-react";
import Lottie from "lottie-react";
import animation404 from "@/assets/Error 404_ Page Not Found.json";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 px-4 text-center">
      {/* Animation */}
      <div className="w-full max-w-md mx-auto">
        <Lottie animationData={animation404} loop autoplay />
      </div>

      {/* Title */}
      <h1 className="mt-6 text-5xl font-bold text-gray-800">
        Oops! Trang không tồn tại
      </h1>

      {/* Icon & Message */}
      <p className="mt-4 flex items-center justify-center gap-2 text-lg text-gray-600">
        <LucideAlertCircle className="w-6 h-6 text-red-500" />
        Có vẻ bạn đã đi nhầm đường…
      </p>

      {/* Button đi về trang chủ */}
      <Link
        to="/"
        className="mt-8 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white text-base font-medium transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        Quay về Trang chủ
      </Link>
    </div>
  );
}
