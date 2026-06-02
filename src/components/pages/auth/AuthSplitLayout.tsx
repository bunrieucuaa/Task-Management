import { Link } from "@tanstack/react-router";
import { LayoutList } from "lucide-react";
import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useState,
} from "react";

type LottieComponent = ComponentType<{
  animationData: object;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
}>;

export default function AuthSplitLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [Lottie, setLottie] = useState<LottieComponent | null>(null);
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([import("lottie-react"), import("@/assets/work.json")]).then(
      ([lottieModule, animationModule]) => {
        if (!isMounted) {
          return;
        }

        setLottie(() => lottieModule.default as LottieComponent);
        setAnimationData(animationModule.default);
      },
    );

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-[#22c55e] via-[#60a5fa] to-[#a78bfa]" />
        <div className="relative flex h-full w-full items-center justify-center p-10">
          <div className="w-full max-w-xl">
            {Lottie && animationData ? (
              <Lottie
                animationData={animationData}
                loop
                autoplay
                className="h-full w-full"
              />
            ) : (
              <div className="aspect-square w-full rounded-3xl bg-white/10" />
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link to="/login" className="flex items-center gap-2 font-medium">
            <div className="flex size-7 items-center justify-center rounded-md bg-linear-to-r from-[#22c55e] via-[#60a5fa] to-[#a78bfa] text-primary-foreground">
              <LayoutList className="size-5" />
            </div>
            <h1 className="bg-linear-to-r from-[#22c55e] via-[#60a5fa] to-[#a78bfa] bg-clip-text text-transparent">
              Task Management App
            </h1>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
    </div>
  );
}

