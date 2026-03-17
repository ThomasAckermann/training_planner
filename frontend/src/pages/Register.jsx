import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function Register() {
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(values) {
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      });
    } catch {
      // Error handled in useAuth hook
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-4xl mb-2 tracking-wide"
            style={{
              fontFamily: '"Bebas Neue", cursive',
              color: "var(--color-text)",
            }}
          >
            Create Account
          </h1>
          <p style={{ color: "var(--color-text-muted)" }}>
            Join the volleyball coach community
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          {/* Google OAuth */}
          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors hover:bg-surface2/80"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"
              />
              <path
                fill="#34A853"
                d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"
              />
              <path
                fill="#FBBC05"
                d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"
              />
              <path
                fill="#EA4335"
                d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"
              />
            </svg>
            Continue with Google
          </a>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div
                className="w-full border-t"
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>
            <div
              className="relative flex justify-center text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              <span
                className="px-2"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                or continue with email
              </span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            <Input
              label="Full Name"
              type="text"
              placeholder="Jane Smith"
              icon={User}
              error={errors.name?.message}
              autoComplete="name"
              {...register("name")}
            />

            <Input
              label="Email"
              type="email"
              placeholder="coach@example.com"
              icon={Mail}
              error={errors.email?.message}
              autoComplete="email"
              {...register("email")}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              icon={Lock}
              error={errors.password?.message}
              autoComplete="new-password"
              {...register("password")}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              icon={Lock}
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
              {...register("confirmPassword")}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="w-full mt-2"
            >
              Create Account
            </Button>
          </form>

          <div
            className="mt-6 pt-6 text-center text-sm border-t"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--color-accent)" }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
