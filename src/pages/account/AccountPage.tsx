import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeCheck, ImageIcon, Mail, ShieldCheck, User } from "lucide-react";
import { updateOwnProfile } from "@/redux/usersSlice";

export default function AccountPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { submitting } = useAppSelector((state) => state.users);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(user?.name ?? "");
    setAvatarUrl(user?.avatarUrl ?? "");
  }, [user]);

  if (!user) {
    return null;
  }

  const currentUser = user;

  const initials = currentUser.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function handleSaveProfile() {
    dispatch(
      updateOwnProfile({
        id: String(currentUser.id),
        data: {
          name: name.trim(),
          avatarUrl: avatarUrl.trim() || null,
        },
      }),
    )
      .unwrap()
      .then((updatedUser) => {
        if (updatedUser) {
          toast.success("Cập nhật thông tin thành công!", {
            position: "bottom-right",
          });
        }
      })
      .catch((error) => {
        console.error("Update profile error:", error);
      });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-8">
      <div className="flex items-center gap-3">
        <BadgeCheck className="size-6 text-[#60a5fa]" />
        <h1 className="text-2xl font-bold">Thông tin tài khoản</h1>
      </div>

      <div className="flex items-center gap-5 rounded-xl border bg-card p-6 shadow-sm">
        <Avatar className="size-20 rounded-xl">
          <AvatarImage src={currentUser.avatarUrl ?? ""} alt={currentUser.name} />
          <AvatarFallback className="rounded-xl bg-linear-to-br from-[#22c55e] via-[#60a5fa] to-[#a78bfa] text-2xl font-bold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <p className="text-xl font-bold">{currentUser.name}</p>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#22c55e]/10 px-2.5 py-1 text-xs font-semibold text-[#22c55e]">
            <ShieldCheck className="size-3.5" />
            {currentUser.role}
          </span>
          <span className="text-sm text-muted-foreground">{currentUser.status}</span>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldBlock
            icon={<User className="size-4 text-muted-foreground" />}
            label="Họ và tên"
          >
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </FieldBlock>

          <FieldBlock
            icon={<ImageIcon className="size-4 text-muted-foreground" />}
            label="Avatar URL"
          >
            <Input
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://example.com/avatar.png"
            />
          </FieldBlock>

          <FieldBlock
            icon={<Mail className="size-4 text-muted-foreground" />}
            label="Email"
          >
            <Input value={currentUser.email} disabled />
          </FieldBlock>

          <FieldBlock
            icon={<ShieldCheck className="size-4 text-muted-foreground" />}
            label="Vai trò"
          >
            <Input value={currentUser.role} disabled />
          </FieldBlock>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveProfile} disabled={submitting}>
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FieldBlock({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}
