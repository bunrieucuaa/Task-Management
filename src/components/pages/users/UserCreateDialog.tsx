import { useEffect } from "react";
import * as z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AppSelect } from "@/components/ui/app-select";
import type { ICreateUserPayload } from "@/app/entities/user.entity";
import { ERole } from "@/app/shared/enums/ERole";

interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting: boolean;
  onSubmit: (payload: ICreateUserPayload) => Promise<void>;
}

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Họ và tên không được để trống" })
    .max(100, { message: "Họ và tên không được vượt quá 100 ký tự" }),
  email: z
    .string()
    .trim()
    .min(1, { message: "Email không được để trống" })
    .email("Email không hợp lệ"),
  role: z.nativeEnum(ERole),
});

export default function UserCreateDialog({
  open,
  onOpenChange,
  submitting,
  onSubmit,
}: UserCreateDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: ERole.Member,
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        name: "",
        email: "",
        role: ERole.Member,
      });
    }
  }, [form, open]);

  async function handleSubmit(data: z.infer<typeof formSchema>) {
    await onSubmit({
      name: data.name.trim(),
      email: data.email.trim(),
      role: data.role,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo user mới</DialogTitle>
          <DialogDescription>
            Admin tạo tài khoản mới và nhận về mật khẩu tạm để gửi cho user.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">Họ và tên</label>
                <Input {...field} placeholder="Nguyen Van A" />
                {fieldState.error ? (
                  <p className="text-sm text-destructive">{fieldState.error.message}</p>
                ) : null}
              </div>
            )}
          />

          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input {...field} type="email" placeholder="nguyenvana@example.com" />
                {fieldState.error ? (
                  <p className="text-sm text-destructive">{fieldState.error.message}</p>
                ) : null}
              </div>
            )}
          />

          <Controller
            name="role"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">Vai trò</label>
                <AppSelect
                  className="w-full"
                  value={field.value}
                  onValueChange={(value) => field.onChange(value as ERole)}
                  options={[
                    { value: ERole.Member, label: "MEMBER" },
                    { value: ERole.PM, label: "PM" },
                    { value: ERole.Admin, label: "ADMIN" },
                  ]}
                />
                {fieldState.error ? (
                  <p className="text-sm text-destructive">{fieldState.error.message}</p>
                ) : null}
              </div>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang tạo..." : "Tạo user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
