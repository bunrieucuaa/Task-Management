import { Link } from "@tanstack/react-router";
import { LucideAlertCircle } from "lucide-react";
import { type ComponentType, useEffect, useState } from "react";

type LottieComponent = ComponentType<{
  animationData: object;
  loop?: boolean;
  autoplay?: boolean;
}>;

export default function NotFound() {
  const [Lottie, setLottie] = useState<LottieComponent | null>(null);
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      import("lottie-react"),
      import("@/assets/Error 404_ Page Not Found.json"),
    ]).then(([lottieModule, animationModule]) => {
      if (!isMounted) {
        return;
      }

      setLottie(() => lottieModule.default as LottieComponent);
      setAnimationData(animationModule.default);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="mx-auto w-full max-w-md">
        {Lottie && animationData ? (
          <Lottie animationData={animationData} loop autoplay />
        ) : (
          <div className="aspect-square w-full rounded-3xl bg-gray-200" />
        )}
      </div>

      <h1 className="mt-6 text-5xl font-bold text-gray-800">
        Oops! Trang không tồn tại
      </h1>

      <p className="mt-4 flex items-center justify-center gap-2 text-lg text-gray-600">
        <LucideAlertCircle className="h-6 w-6 text-red-500" />
        Có vẻ bạn đã đi nhầm đường…
      </p>

      <Link
        to="/"
        className="mt-8 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        Quay về Trang chủ
      </Link>
    </div>
  );
}
