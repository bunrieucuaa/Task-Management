// import AuthSplitLayout from "@/components/pages/auth/AuthSplitLayout";
import { useAppSelector } from "@/app/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck, Mail, ShieldCheck, User } from "lucide-react";

export default function AccountPage() {
  const { user } = useAppSelector((state) => state.auth);

  console.log("User", user);
  

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BadgeCheck className="size-6 text-[#60a5fa]" />
        <h1 className="text-2xl font-bold">Thông tin tài khoản</h1>
      </div>

      {/* Avatar + Name Card */}
      <div className="rounded-xl border bg-card p-6 flex items-center gap-5 shadow-sm">
        <Avatar className="size-20 rounded-xl">
          <AvatarImage src="" alt={user?.name} />
          <AvatarFallback className="rounded-xl text-2xl font-bold bg-linear-to-br from-[#22c55e] via-[#60a5fa] to-[#a78bfa] text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <p className="text-xl font-bold">{user?.name ?? "—"}</p>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#22c55e]/10 text-[#22c55e] w-fit">
            <ShieldCheck className="size-3.5" />
            {user?.role ?? "—"}
          </span>
        </div>
      </div>

      {/* Info Fields */}
      <div className="rounded-xl border bg-card shadow-sm divide-y">
        <InfoRow
          icon={<User className="size-4 text-muted-foreground" />}
          label="Họ và tên"
          value={user?.name ?? "—"}
        />
        <InfoRow
          icon={<Mail className="size-4 text-muted-foreground" />}
          label="Email"
          value={user?.email ?? "—"}
        />
        <InfoRow
          icon={<ShieldCheck className="size-4 text-muted-foreground" />}
          label="Vai trò"
          value={user?.role ?? "—"}
        />
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="flex items-center justify-center size-8 rounded-lg bg-muted shrink-0">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 flex-1">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className="text-sm font-semibold">{value}</span>
      </div>
    </div>
  );
}
