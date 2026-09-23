"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUTH_ERRORS, mapSignInError, mapSignUpError, mapVerificationError } from "@/lib/auth/errors";

type Mode = "login" | "signup" | "verify";

const LABEL_CLASSES = "font-mono text-xs uppercase tracking-wider";
const TAB_BASE =
  "flex-1 rounded-none border-2 md:border-4 border-black font-black uppercase text-xs md:text-sm px-4 py-2 md:py-3 transition-all duration-200";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, fetchStatus: signInFetchStatus } = useSignIn();
  const { signUp, fetchStatus: signUpFetchStatus } = useSignUp();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loading = signInFetchStatus === "fetching" || signUpFetchStatus === "fetching";

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setError(null);
    setPassword("");
    setCode("");
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (!signIn) return;
    setError(null);
    const { error: signInError } = await signIn.password({ emailAddress: email, password });
    if (signInError) {
      setError(mapSignInError(signInError));
      return;
    }
    if (signIn.status === "complete") {
      await signIn.finalize();
      router.push("/dashboard");
    } else {
      setError(AUTH_ERRORS.generic);
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    if (!signUp) return;
    setError(null);
    const { error: signUpError } = await signUp.password({ emailAddress: email, password });
    if (signUpError) {
      setError(mapSignUpError(signUpError));
      return;
    }
    const { error: codeError } = await signUp.verifications.sendEmailCode();
    if (codeError) {
      setError(mapSignUpError(codeError));
      return;
    }
    setMode("verify");
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!signUp) return;
    setError(null);
    const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code });
    if (verifyError) {
      setError(mapVerificationError(verifyError));
      return;
    }
    if (signUp.status === "complete") {
      await signUp.finalize();
      router.push("/dashboard");
    } else {
      setError(AUTH_ERRORS.invalidVerification);
    }
  }

  async function handleResendCode() {
    if (!signUp) return;
    setError(null);
    const { error: codeError } = await signUp.verifications.sendEmailCode();
    if (codeError) setError(mapSignUpError(codeError));
  }

  return (
    <section className="bg-white text-black py-12 md:py-24 px-4 md:px-8 lg:px-12">
      <div className="max-w-md mx-auto">
        {mode !== "verify" && (
          <div className="flex gap-2 md:gap-4 mb-6 md:mb-8">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`${TAB_BASE} ${mode === "login" ? "bg-[#ff006e] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-black shadow-none"}`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`${TAB_BASE} ${mode === "signup" ? "bg-[#ff006e] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-black shadow-none"}`}
            >
              Sign Up
            </button>
          </div>
        )}

        <div className="rounded-none border-2 md:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-4 md:p-8">
          {/* Required by Clerk's bot-protection CAPTCHA for custom sign-up flows: https://clerk.com/docs/guides/development/custom-flows/authentication/bot-sign-up-protection */}
          <div id="clerk-captcha" />
          {error && (
            <div className="mb-4 md:mb-6 rounded-none border-2 border-black bg-[#ff006e] text-white font-mono text-xs md:text-sm px-3 py-2 md:px-4 md:py-3">
              {error}
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4 md:gap-6">
              <h1 className="font-black tracking-tight text-2xl md:text-3xl">Log In</h1>
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className={LABEL_CLASSES}>Email</label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className={LABEL_CLASSES}>Password</label>
                <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Logging In..." : "Log In"}
              </Button>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignUp} className="flex flex-col gap-4 md:gap-6">
              <h1 className="font-black tracking-tight text-2xl md:text-3xl">Sign Up</h1>
              <div className="flex flex-col gap-2">
                <label htmlFor="signup-email" className={LABEL_CLASSES}>Email</label>
                <Input id="signup-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="signup-password" className={LABEL_CLASSES}>Password</label>
                <Input id="signup-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating Account..." : "Sign Up"}
              </Button>
            </form>
          )}

          {mode === "verify" && (
            <form onSubmit={handleVerify} className="flex flex-col gap-4 md:gap-6">
              <h1 className="font-black tracking-tight text-2xl md:text-3xl">Verify Your Email</h1>
              <p className="font-mono text-sm text-black/80">
                We sent a 6-digit code to <span className="font-bold">{email}</span>.
              </p>
              <div className="flex flex-col gap-2">
                <label htmlFor="code" className={LABEL_CLASSES}>Verification Code</label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Verifying..." : "Verify"}
              </Button>
              <button
                type="button"
                onClick={handleResendCode}
                className="font-mono text-xs uppercase tracking-wider underline self-start"
              >
                Resend Code
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
