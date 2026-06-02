import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { IUserWithTemporaryPasswordData } from "@/app/entities/user.entity";

interface TemporaryPasswordDialogProps {
  open: boolean;
  data: IUserWithTemporaryPasswordData | null;
  onClose: () => void;
}

export default function TemporaryPasswordDialog({
  open,
  data,
  onClose,
}: TemporaryPasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mật khẩu tạm thời</DialogTitle>
          <DialogDescription>
            Giá trị này chỉ xuất hiện một lần. Hãy copy và gửi lại cho user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4">
            <div className="text-sm text-muted-foreground">User</div>
            <div className="font-medium">{data?.user.email ?? "—"}</div>
          </div>

          <div className="rounded-lg border bg-black px-4 py-3 font-mono text-sm text-white">
            {data?.temporaryPassword ?? ""}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Đã copy xong
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
