import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ERole, isPrivilegedRole } from "@/app/shared/enums/ERole";
import type { ITask } from "@/app/entities/task.entity";
import type { IComment } from "@/app/entities/comment.entity";
import {
  clearComments,
  createComment,
  deleteComment,
  fetchComments,
} from "@/redux/commentsSlice";

interface TaskCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: ITask | null;
}

const initials = (name?: string) =>
  (name ?? "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function TaskCommentsDialog({
  open,
  onOpenChange,
  task,
}: TaskCommentsDialogProps) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { items, loading, submitting } = useAppSelector((state) => state.comments);
  const [content, setContent] = useState("");
  const listEndRef = useRef<HTMLDivElement | null>(null);

  // Load this task's comments whenever the dialog opens; clear on close.
  useEffect(() => {
    if (open && task) {
      void dispatch(fetchComments(task.id));
    }
    if (!open) {
      dispatch(clearComments());
      // Intentional: clear the draft when the dialog closes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContent("");
    }
  }, [open, task, dispatch]);

  // Keep the newest comment in view.
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [items.length]);

  if (!user) {
    return null;
  }

  const canDelete = (comment: IComment) =>
    isPrivilegedRole(user.role as ERole) || comment.userId === user.id;

  async function handleSubmit() {
    const text = content.trim();
    if (!text || !task) {
      return;
    }
    const result = await dispatch(
      createComment({ taskId: task.id, content: text }),
    ).unwrap();
    if (result) {
      setContent("");
    }
  }

  function handleDelete(comment: IComment) {
    if (!task) {
      return;
    }
    dispatch(deleteComment({ taskId: task.id, commentId: comment.id }))
      .unwrap()
      .then((deletedId) => {
        if (deletedId) {
          toast.success("Đã xoá bình luận!", { position: "bottom-right" });
        }
      })
      .catch((error) => console.error("Delete comment error:", error));
  }

  // Ctrl/Cmd + Enter để gửi nhanh.
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bình luận</DialogTitle>
          <DialogDescription className="truncate">
            {task ? task.title : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
          {loading ? (
            <p className="text-sm text-muted-foreground">Đang tải bình luận...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có bình luận nào. Hãy là người đầu tiên!
            </p>
          ) : (
            items.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar size="sm">
                  {comment.user?.avatarUrl ? (
                    <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} />
                  ) : null}
                  <AvatarFallback>{initials(comment.user?.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {comment.user?.name ?? "Người dùng"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm")}
                      </span>
                      {canDelete(comment) ? (
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                          disabled={submitting}
                          aria-label="Xoá bình luận"
                          onClick={() => handleDelete(comment)}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm text-foreground/90">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={listEndRef} />
        </div>

        <div className="space-y-2 border-t pt-4">
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="Viết bình luận... (Ctrl + Enter để gửi)"
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting || !content.trim()}>
              {submitting ? "Đang gửi..." : "Gửi bình luận"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
