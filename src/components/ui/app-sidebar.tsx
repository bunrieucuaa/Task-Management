import { Calendar, Home, Settings, Train, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "@tanstack/react-router";
import { NavUser } from "./nav-footer";
import { useAppSelector } from "@/app/hooks";
import { ERole } from "@/app/shared/enums/ERole";

export function AppSidebar() {
  const { pathname } = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const items = [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Tasks Management",
      url: "/tasks",
      icon: Train,
    },
    ...(user?.role === ERole.Admin
      ? [
          {
            title: "Users Management",
            url: "/users",
            icon: Users,
          },
        ]
      : []),
    {
      title: "Drag & Drop",
      url: "/drag-drop",
      icon: Calendar,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-0">
        <div className="border-b px-4 py-4 text-lg font-semibold">
          Task Management
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.url} className="flex w-full items-center gap-3">
                        <item.icon className="size-4" />
                        <span style={{ fontWeight: 600 }}>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
