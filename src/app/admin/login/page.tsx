"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "loading" | "error";

export default function AdminLoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="site-shell form-shell">
      <h1>Admin Login</h1>
      <p className="footer-note">Authorized staff only.</p>

      <form onSubmit={onSubmit} style={{ marginTop: "1rem" }}>
        <div className="form-grid">
          <div>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              defaultValue="admin"
              required
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                className="password-input"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
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
        </div>

        <div style={{ marginTop: "1rem" }}>
          <button className="btn btn-primary" disabled={status === "loading"}>
            {status === "loading" ? "Signing in..." : "Sign in"}
          </button>
          {message ? <p className="footer-note">{message}</p> : null}
        </div>
      </form>

      <p className="footer-note" style={{ marginTop: "1rem" }}>
        <Link href="/menu">Back to menu</Link>
      </p>
    </main>
  );
}
