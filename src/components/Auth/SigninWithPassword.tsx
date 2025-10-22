"use client";
import { EmailIcon, PasswordIcon } from "@/assets/icons";
import { persistAuth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/env";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";
import InputGroup from "../FormElements/InputGroup";
import { Checkbox } from "../FormElements/checkbox";

const LOGIN_ENDPOINT = buildApiUrl("api/users/login");

export default function SigninWithPassword() {
  const [data, setData] = useState({
    email: process.env.NEXT_PUBLIC_DEMO_USER_MAIL || "",
    password: process.env.NEXT_PUBLIC_DEMO_USER_PASS || "",
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!data.email || !data.password) {
      toast.error("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message =
          (errorBody && (errorBody.message as string)) ||
          "Unable to sign in. Please try again.";

        throw new Error(message);
      }

      const result = await response.json();
      const tokens = result?.data;

      if (!tokens?.access_token || !tokens?.refresh_token) {
        throw new Error("Login response is missing tokens");
      }

      persistAuth({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });

      toast.success("Signed in successfully");

      router.push("/");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputGroup
        type="email"
        label="Email"
        className="mb-4 [&_input]:py-[15px]"
        placeholder="Enter your email"
        name="email"
        handleChange={handleChange}
        value={data.email}
        icon={<EmailIcon />}
      />

      <InputGroup
        type={showPassword ? "text" : "password"}
        label="Password"
        className="mb-5 [&_input]:py-[15px]"
        placeholder="Enter your password"
        name="password"
        handleChange={handleChange}
        value={data.password}
        icon={<PasswordIcon />}
        suffix={
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-xs font-semibold uppercase tracking-wide text-primary transition hover:text-primary/80 focus:outline-none"
            aria-pressed={showPassword}
          >
            {showPassword ? "Ẩn" : "Hiện"}
          </button>
        }
      />

      <div className="mb-6 flex items-center justify-between gap-2 py-2 font-medium">
        <Checkbox
          label="Remember me"
          name="remember"
          withIcon="check"
          minimal
          radius="md"
          onChange={(e) =>
            setData({
              ...data,
              remember: e.target.checked,
            })
          }
        />

        <Link
          href="/auth/forgot-password"
          className={cn(
            "hover:text-primary dark:text-white dark:hover:text-primary",
            loading && "pointer-events-none opacity-70",
          )}
          aria-disabled={loading}
          tabIndex={loading ? -1 : undefined}
        >
          Forgot Password?
        </Link>
      </div>

      <div className="mb-4.5">
        <button
          type="submit"
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90",
            loading && "cursor-not-allowed opacity-80",
          )}
          disabled={loading}
        >
          Sign In
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
          )}
        </button>
      </div>
    </form>
  );
}
