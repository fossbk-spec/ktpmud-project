import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

import { Button } from "../../../shared/components/Button";
import { TextInput } from "../../../shared/components/Input";
import eyeIcon from "../../../assets/icons/eye.svg";
import eyeOffIcon from "../../../assets/icons/eye-off.svg";
import facebookIcon from "../../../assets/icons/facebook.svg";

export type LoginRole = "OWNER" | "PLAYER" | "ADMIN";

export interface LoginSubmitPayload {
  role: LoginRole;
  identifier: string;
  password: string;
}

interface LoginFormValues {
  identifier: string;
  password: string;
}

interface LoginFormErrors {
  identifier?: string;
  password?: string;
  global?: string;
}

interface LoginFormProps {
  onSubmit?: (payload: LoginSubmitPayload) => Promise<void> | void;
  onGoogleSuccess?: (idToken: string) => Promise<void> | void;
}

const EMAIL_OR_PHONE_REGEX = /^(?:\+?\d[\d\s-]{7,}|[^\s@]+@[^\s@]+\.[^\s@]+)$/;

export function LoginForm({ onSubmit, onGoogleSuccess }: LoginFormProps) {
  const navigate = useNavigate();
  const [values, setValues] = useState<LoginFormValues>({
    identifier: "",
    password: "",
  });
  const [selectedRole, setSelectedRole] = useState<LoginRole>("PLAYER");
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const identifierPlaceholder = useMemo(() => "Email hoặc số điện thoại", []);

  const validate = (): LoginFormErrors => {
    const nextErrors: LoginFormErrors = {};

    if (!values.identifier.trim()) {
      nextErrors.identifier = "Vui lòng nhập email hoặc số điện thoại.";
    } else if (!EMAIL_OR_PHONE_REGEX.test(values.identifier.trim())) {
      nextErrors.identifier = "Định dạng email hoặc số điện thoại chưa hợp lệ.";
    }

    if (!values.password.trim()) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    } else if (values.password.trim().length < 6) {
      nextErrors.password = "Mật khẩu cần ít nhất 6 ký tự.";
    }

    return nextErrors;
  };

  const submitWithRole = async (role: LoginRole, redirectPath: string) => {
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      if (onSubmit) {
        await onSubmit({
          role,
          identifier: values.identifier.trim(),
          password: values.password.trim(),
        });
      } else {
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 900);
        });
      }

      navigate(redirectPath);
    } catch (error: unknown) {
      const apiMsg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error instanceof Error ? error.message : null);
      setErrors({ global: apiMsg || "Đăng nhập thất bại. Vui lòng thử lại." });
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (
    identifier: string,
    password: string,
    role: LoginRole,
  ) => {
    setValues({ identifier, password });
    setSelectedRole(role);
    setErrors({});
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const redirectPath = selectedRole === "ADMIN" ? "/admin" : "/";
    void submitWithRole(selectedRole, redirectPath);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mx-auto flex w-full max-w-[399px] flex-col gap-3.5">
        <TextInput
          id="identifier"
          label="Email hoặc số điện thoại"
          name="identifier"
          value={values.identifier}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              identifier: event.target.value,
            }))
          }
          placeholder={identifierPlaceholder}
          autoComplete="username"
          error={errors.identifier}
        />

        <div className="flex flex-col gap-1.5">
          <TextInput
            id="password"
            label="Mật khẩu"
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            value={values.password}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            placeholder="Mật khẩu"
            autoComplete="current-password"
            error={errors.password}
            rightAdornment={
              <button
                type="button"
                onClick={() => setIsPasswordVisible((current) => !current)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 cursor-pointer"
                aria-label={isPasswordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                <img
                  src={isPasswordVisible ? eyeOffIcon : eyeIcon}
                  alt=""
                  aria-hidden="true"
                  className="h-5 w-5"
                />
              </button>
            }
          />
          <div className="flex justify-end px-1">
            <Link
              to="/forgot-password"
              className="text-xs text-white/70 hover:text-white transition font-medium focus-visible:outline-none"
            >
              Quên mật khẩu?
            </Link>
          </div>
        </div>

        {/* Role selector + Primary Đăng nhập button */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/15 bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => setSelectedRole("PLAYER")}
              aria-pressed={selectedRole === "PLAYER"}
              className={`h-10 rounded-lg text-sm font-semibold transition cursor-pointer ${
                selectedRole === "PLAYER"
                  ? "bg-emerald-500 text-white shadow"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              Khách hàng
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole("ADMIN")}
              aria-pressed={selectedRole === "ADMIN"}
              className={`h-10 rounded-lg text-sm font-semibold transition cursor-pointer ${
                selectedRole === "ADMIN"
                  ? "bg-emerald-500 text-white shadow"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              Chủ sân
            </button>
          </div>

          <Button
            type="submit"
            loading={isLoading}
            className="h-[50px] w-full rounded-xl text-[15px] font-bold"
          >
            Đăng nhập
          </Button>
        </div>

        {/* Quick demo account autofill for live demo */}
        <div className="rounded-xl border border-white/15 bg-white/[0.04] p-2.5 text-xs text-white/80">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-semibold text-white/90">Tài khoản Demo nhanh:</span>
            <span className="text-[11px] text-white/60">Mật khẩu: Demo@123</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount("owner@soccerbooker.vn", "Demo@123", "ADMIN")}
              className="flex-1 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-500/25 cursor-pointer"
            >
              Điền Chủ sân
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount("client@soccerbooker.vn", "Demo@123", "PLAYER")}
              className="flex-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/20 cursor-pointer"
            >
              Điền Khách hàng
            </button>
          </div>
        </div>

        {errors.global ? (
          <p className="text-center text-sm font-medium text-red-300">
            {errors.global}
          </p>
        ) : null}

        {/* Premium Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-3 text-[11px] text-white/40 font-semibold uppercase tracking-wider">Hoặc</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        {/* Social login buttons */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-full overflow-hidden hover:opacity-90 transition duration-200 shadow-md">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  try {
                    await onGoogleSuccess?.(credentialResponse.credential);
                  } catch (err) {
                    console.error("Google login error:", err);
                    const errMsg = err instanceof Error ? err.message : "Đăng nhập Google thất bại.";
                    setErrors({ global: errMsg });
                  }
                }
              }}
              onError={() => {
                console.error("Google sign in failed");
                setErrors({ global: "Đăng nhập Google thất bại." });
              }}
              theme="filled_blue"
              shape="circle"
              type="icon"
            />
          </div>
          <button
            type="button"
            aria-label="Đăng nhập với Facebook"
            className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden hover:opacity-90 transition duration-200 shadow-md bg-[#1877F2]"
          >
            <img src={facebookIcon} alt="" className="h-full w-full object-cover" />
          </button>
        </div>
      </div>
    </form>
  );
}
