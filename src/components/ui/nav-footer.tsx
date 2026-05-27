import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  Sparkles,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { logoutUser } from "@/redux/authSlice";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function NavUser() {
  const { isMobile } = useSidebar();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const displayName = user?.name ?? user?.email ?? "User";
  const displayEmail = user?.email ?? "";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function handleLogout() {
    dispatch(logoutUser())
      .unwrap()
      .then(() => {
        toast.success("Đã đăng xuất!", { position: "bottom-right" });
        navigate({ to: "/login" });
      })
      .catch(() => {
        // Dù API thất bại vẫn xoá local và redirect
        toast.info("Đã đăng xuất khỏi thiết bị này.", { position: "bottom-right" });
        navigate({ to: "/login" });
      });
  }

  function handleAccount() {
    navigate({ to: "/account" });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src="" alt={displayName} />
                <AvatarFallback className="rounded-lg bg-linear-to-br from-[#22c55e] via-[#60a5fa] to-[#a78bfa] text-white font-bold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="" alt={displayName} />
                  <AvatarFallback className="rounded-lg bg-linear-to-br from-[#22c55e] via-[#60a5fa] to-[#a78bfa] text-white font-bold text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                id="nav-account-btn"
                className="cursor-pointer"
                onClick={handleAccount}
              >
                <BadgeCheck />
                Thông tin tài khoản
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              id="nav-logout-btn"
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
