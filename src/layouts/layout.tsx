import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bell,
  Languages,
  MoonIcon,
  SunIcon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useId } from "react";
import { useTheme } from "next-themes";
import { motion, useReducedMotion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  // DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children }: { children: React.ReactNode }) {
  const id = useId();
  const { theme, setTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const checked = theme === "dark";
  const setChecked = (next: boolean) => setTheme(next ? "dark" : "light");
  const toggleSwitch = () => setChecked(!checked);

  return (
    <SidebarProvider>
      <AppSidebar />

      <div className="flex flex-1 flex-col">
        <header className="bg-card sticky top-0 z-50 border-b">
          <div className="mx-auto flex items-center justify-between gap-6 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-4">
              {/* Trigger Sidebar */}
              <SidebarTrigger className="[&_svg]:size-5!" />

              <Separator
                orientation="vertical"
                className="hidden h-4! sm:block"
              />

              {/* Breadcrumb */}
              <Breadcrumb className="hidden sm:block">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Home</BreadcrumbPage>
                  </BreadcrumbItem>
                  {/* <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                  </BreadcrumbItem> */}
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink>Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  {/* <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Free</BreadcrumbPage>
                  </BreadcrumbItem> */}
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Right side */}
            <div
              className="flex group items-center gap-2"
              data-state={checked ? "checked" : "unchecked"}
            >
              <motion.span
                id={`${id}-light`}
                className="group-data-[state=checked]:text-muted-foreground/70 cursor-pointer text-left text-sm font-medium"
                aria-controls={id}
                onClick={() => setChecked(false)}
                animate={
                  reduceMotion
                    ? undefined
                    : { rotate: checked ? -25 : 0, scale: checked ? 0.85 : 1 }
                }
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
              >
                <SunIcon className="size-4" aria-hidden="true" />
              </motion.span>
              <Switch
                id={id}
                checked={checked}
                onCheckedChange={toggleSwitch}
                aria-labelledby={`${id}-dark ${id}-light`}
                aria-label="Toggle between dark and light mode"
              />
              <motion.span
                id={`${id}-dark`}
                className="group-data-[state=unchecked]:text-muted-foreground/70 cursor-pointer text-right text-sm font-medium"
                aria-controls={id}
                onClick={() => setChecked(true)}
                animate={
                  reduceMotion
                    ? undefined
                    : { rotate: checked ? 0 : 25, scale: checked ? 1 : 0.85 }
                }
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
              >
                <MoonIcon className="size-4" aria-hidden="true" />
              </motion.span>

              <div className="flex flex-wrap items-center ml-2 gap-2 md:flex-row">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Languages className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>English</DropdownMenuItem>
                    <DropdownMenuItem>Tiếng Việt</DropdownMenuItem>
                    <DropdownMenuItem>日本語</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="icon">
                  <Bell />
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto size-full flex-1 px-4 py-6 sm:px-6">
          <Card className="min-h-full">
            <CardContent className="h-full">
              <div className="border-card-foreground/10 h-full rounded-md">
                <PageTransition>{children}</PageTransition>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}
