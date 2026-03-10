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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
