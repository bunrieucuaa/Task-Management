import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { changePassword } from "@/redux/authSlice";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 32;

const passwordRules = z
  .string()
  .min(1, { message: "Mật khẩu không được trống" })
  .min(MIN_PASSWORD_LENGTH, {
    message: `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`,
  })
  .max(MAX_PASSWORD_LENGTH, {
    message: `Mật khẩu không được vượt quá ${MAX_PASSWORD_LENGTH} ký tự`,
  })
  .regex(/[A-Z]/, { message: "Mật khẩu phải chứa ít nhất 1 chữ hoa" })
  .regex(/[a-z]/, { message: "Mật khẩu phải chứa ít nhất 1 chữ thường" })
  .regex(/[0-9]/, { message: "Mật khẩu phải chứa ít nhất 1 chữ số" })
  .regex(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/, {
    message: "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt",
  });

const formSchema = z
  .object({
    oldPassword: z.string().min(1, { message: "Vui lòng nhập mật khẩu cũ" }),
    newPassword: passwordRules,
    confirmPassword: z.string().min(1, { message: "Vui lòng xác nhận mật khẩu mới" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "Mật khẩu mới phải khác mật khẩu cũ",
    path: ["newPassword"],
  });

export function ChangePasswordForm() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading } = useAppSelector((state) => state.auth);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    dispatch(
      changePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      }),
    )
      .unwrap()
      .then((isSuccess) => {
        if (isSuccess) {
          toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.", {
            position: "bottom-right",
          });
          navigate({ to: "/login" });
        } else {
          toast.error("Đổi mật khẩu thất bại. Vui lòng kiểm tra lại thông tin.", {
            position: "bottom-right",
          });
        }
      })
      .catch((error) => {
        console.error("Change password error:", error);
      });
  }

  return (
    <form
      id="form-rhf-change-password"
      className={cn("flex flex-col gap-6")}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold bg-linear-to-r from-[#22c55e] via-[#60a5fa] to-[#a78bfa] bg-clip-text text-transparent">
          Đổi mật khẩu lần đầu
        </h1>
        <FieldDescription className="text-center text-sm text-muted-foreground">
          Tài khoản của bạn cần đổi mật khẩu trước khi sử dụng hệ thống.
        </FieldDescription>
      </div>

      <FieldGroup>
        {/* Old Password */}
        <Controller
          name="oldPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="form-rhf-cp-old">Mật khẩu cũ (do Admin cấp)</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id="form-rhf-cp-old"
                  type={showOld ? "text" : "password"}
                  aria-invalid={fieldState.invalid}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  tabIndex={-1}
                  onClick={() => setShowOld((v) => !v)}
                  className="absolute inset-y-0 right-1 my-auto text-muted-foreground hover:text-foreground"
                  aria-label={showOld ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showOld ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* New Password */}
        <Controller
          name="newPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="form-rhf-cp-new">Mật khẩu mới</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id="form-rhf-cp-new"
                  type={showNew ? "text" : "password"}
                  aria-invalid={fieldState.invalid}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  tabIndex={-1}
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute inset-y-0 right-1 my-auto text-muted-foreground hover:text-foreground"
                  aria-label={showNew ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Confirm Password */}
        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="form-rhf-cp-confirm">Xác nhận mật khẩu mới</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id="form-rhf-cp-confirm"
                  type={showConfirm ? "text" : "password"}
                  aria-invalid={fieldState.invalid}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  tabIndex={-1}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-1 my-auto text-muted-foreground hover:text-foreground"
                  aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Field>
          <Button
            className="bg-linear-to-r from-[#22c55e] via-[#60a5fa] to-[#a78bfa]"
            type="submit"
            form="form-rhf-change-password"
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
          </Button>
        </Field>

        <FieldDescription className="text-center text-xs text-muted-foreground">
          Sau khi đổi mật khẩu thành công, tất cả phiên đăng nhập sẽ bị hủy và bạn cần đăng nhập lại.
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
