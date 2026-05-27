import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { getMe } from "@/redux/authSlice";
import { Navigate, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

interface AuthGuardProps {
  isPrivate: boolean;
}

const AuthGuard = ({ isPrivate }: AuthGuardProps) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, mustChangePassword } = useAppSelector((state) => state.auth);

  // Sau khi reload trang: token vẫn hợp lệ nhưng user bị reset về null
  // Không gọi /me khi mustChangePassword=true vì BE sẽ trả 403 → gây logout không mong muốn
  useEffect(() => {
    if (isAuthenticated && user === null && !mustChangePassword) {
      dispatch(getMe());
    }
  }, [isAuthenticated, user, mustChangePassword, dispatch]);

  return isAuthenticated && isPrivate ? <Outlet /> : <Navigate to="/login" />;
};

export default AuthGuard;
