import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi as viLocale } from "date-fns/locale";
import {
  ClipboardList,
  CircleDot,
  Flag,
  CalendarClock,
  UserCog,
  Tag as TagIcon,
  Activity as ActivityIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ActivityRepository } from "@/app/repositories/ActivityRepository";
import type { IActivity, TActivityAction } from "@/app/entities/activity.entity";
import { describeActivity } from "@/lib/describeActivity";

interface TaskActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: { id: number; title: string } | null;
}

const initials = (name?: string) =>
  (name ?? "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const ACTION_ICONS: Record<TActivityAction, typeof CircleDot> = {
  TASK_CREATED: ClipboardList,
  STATUS_CHANGED: CircleDot,
  PRIORITY_CHANGED: Flag,
  DEADLINE_CHANGED: CalendarClock,
  ASSIGNEE_CHANGED: UserCog,
  TAG_ADDED: TagIcon,
  TAG_REMOVED: TagIcon,
};

export default function TaskActivityDialog({
  open,
  onOpenChange,
  task,
}: TaskActivityDialogProps) {
  const [items, setItems] = useState<IActivity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !task) {
      return;
    }
    let active = true;
    // Intentional: flip into the loading state when the dialog opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    void new ActivityRepository()
      .listByTaskAsync(task.id)
      .then((response) => {
        if (!active) return;
        if (response.success && response.data) {
          setItems(response.data.data);
        } else {
          setItems([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, task]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Lịch sử hoạt động</DialogTitle>
          <DialogDescription className="truncate">
            {task ? task.title : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
          {loading ? (
            <p className="text-sm text-muted-foreground">Đang tải lịch sử...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có hoạt động nào được ghi lại.
            </p>
          ) : (
            items.map((item) => {
              const Icon = ACTION_ICONS[item.action] ?? ActivityIcon;
              return (
                <div key={item.id} className="flex gap-3">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        {item.user?.avatarUrl ? (
                          <AvatarImage src={item.user.avatarUrl} alt={item.user.name} />
                        ) : null}
                        <AvatarFallback>{initials(item.user?.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {item.user?.name ?? "Người dùng"}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90">
                      {describeActivity(item)}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                        locale: viLocale,
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
