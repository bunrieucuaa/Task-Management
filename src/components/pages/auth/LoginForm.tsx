import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "@tanstack/react-router";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { postLogins } from "@/redux/authSlice";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 32;

const formSchema = z.object({
  email: z
    .string()
    .email("Email không hợp lệ")
    .min(1, { message: "Email không được trống" }),
  password: z
    .string()
    .min(1, { message: "Mật khẩu không được trống" }) // Đảm bảo không bị chuỗi rỗng
    .min(MIN_PASSWORD_LENGTH, {
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    })
    .max(MAX_PASSWORD_LENGTH, {
      message: `Password must not exceed ${MAX_PASSWORD_LENGTH} characters`,
    })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, {
      message: "Password must contain at least one number",
    })
    .regex(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/, {
      message: "Password must contain at least one special character",
    }),
});

export function LoginForm() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    dispatch(postLogins(data))
      .unwrap()
      .then((result) => {
        if (result.isValid) {
          if (result.mustChangePassword) {
            toast.info("Bạn cần đổi mật khẩu trước khi tiếp tục!", { position: "bottom-right" });
            navigate({ to: "/change-password" });
          } else {
            toast.success("Đăng nhập thành công!", { position: "bottom-right" });
            navigate({ to: "/" });
          }
        } else {
          toast.error("Tài khoản không có quyền truy cập (Yêu cầu Admin)!", { position: "bottom-right" });
        }
      })
      .catch((error) => {
        console.error("Login dispatch error:", error);
      });
  }

  return (
    <form
      id="form-rhf-login"
      className={cn("flex flex-col gap-6")}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold bg-linear-to-r from-[#22c55e] via-[#60a5fa] to-[#a78bfa] bg-clip-text text-transparent">
          Đăng nhập
        </h1>
      </div>
      <FieldGroup>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="form-rhf-login-email">Email</FieldLabel>
              <Input
                {...field}
                id="form-rhf-login-email"
                aria-invalid={fieldState.invalid}
                placeholder="Email"
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="form-rhf-login-password">
                Mật khẩu
              </FieldLabel>
              {/* <Link
                to="/reset-password"
                className="ml-auto text-sm underline-offset-4 hover:underline"
              >
                Quên mật khẩu ?
              </Link> */}

              <div className="relative">
                <Input
                  {...field}
                  id="form-rhf-login-password"
                  type={showPassword ? "text" : "password"}
                  aria-invalid={fieldState.invalid}
                  placeholder="••••••••••••"
                  autoComplete="off"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-1 my-auto text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
            form="form-rhf-login"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </Field>
        <FieldSeparator>Hoặc tiếp tục với</FieldSeparator>
        <Field>
          <Button variant="outline" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                fill="currentColor"
              />
            </svg>
            Đăng nhập bằng GitHub
          </Button>

          <Button variant="outline" type="button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="24px"
              height="24px"
            >
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              />
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              />
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              />
            </svg>
            Đăng nhập bằng Google
          </Button>

          <FieldDescription className="text-center">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="underline underline-offset-4">
              Đăng ký
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
