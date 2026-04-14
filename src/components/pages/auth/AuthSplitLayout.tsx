import workAnimation from "@/assets/work.json";
import Lottie from "lottie-react";
import { LayoutList } from "lucide-react";
import { Link } from "@tanstack/react-router";

export default function AuthSplitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-[#22c55e] via-[#60a5fa] to-[#a78bfa]" />
        <div className="relative flex h-full w-full items-center justify-center p-10">
          <div className="w-full max-w-xl">
            <Lottie
              animationData={workAnimation}
              loop
              autoplay
              className="h-full w-full"
            />
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

