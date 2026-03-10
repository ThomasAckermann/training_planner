import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function Login() {
  const { login } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(values) {
    try {
      await login(values.email, values.password)
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
            style={{ fontFamily: '"Bebas Neue", cursive', color: 'var(--color-text)' }}
          >
            Welcome Back
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Sign in to your coach account
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="coach@example.com"
              icon={Mail}
              error={errors.email?.message}
              autoComplete="email"
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              error={errors.password?.message}
              autoComplete="current-password"
              {...register('password')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>

          <div
            className="mt-6 pt-6 text-center text-sm border-t"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--color-accent)' }}
            >
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
