"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminThemeToggle from "@/components/admin-theme-toggle";

type Status = "idle" | "loading" | "error";

export default function AdminLoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
      }),
    });

    const json = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setStatus("error");
      setMessage(json.error ?? "Login failed.");
      // Keep what was typed and put the cursor where the fix is likely needed
      passwordRef.current?.focus();
      passwordRef.current?.select();
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="admin-v2 admin-login">
      <div className="admin-login-top">
        <AdminThemeToggle variant="compact" />
      </div>

      <main id="main-content" className="admin-login-card">
        <Image src="/mascot_logo.webp" alt="" width={56} height={56} priority />
        <div>
          <h1>Back office</h1>
          <p className="admin-muted">Authorized staff only.</p>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem" }}>
          <div className="admin-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              required
              aria-invalid={status === "error"}
              aria-describedby={message ? "login-error" : undefined}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="password">Password</label>
            <div className="admin-password">
              <input
                id="password"
                ref={passwordRef}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                aria-invalid={status === "error"}
                aria-describedby={message ? "login-error" : undefined}
              />
              <button
                type="button"
                className="admin-password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      d="M3 3L21 21M10.58 10.58A2 2 0 0013.42 13.42M9.88 5.09A9.77 9.77 0 0112 4c5 0 9.27 3.11 11 7.5a12.32 12.32 0 01-4.03 5.22M6.1 6.1A12.83 12.83 0 001 11.5C2.73 15.89 7 19 12 19a9.6 9.6 0 005.36-1.6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {message ? (
            <p id="login-error" className="admin-form-error" role="alert">
              {message}
            </p>
          ) : null}

          <button className="btn btn-primary admin-login-submit" disabled={status === "loading"}>
            {status === "loading" ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="admin-login-back">
          <Link href="/menu">Back to menu</Link>
        </p>
      </main>
    </div>
  );
}
