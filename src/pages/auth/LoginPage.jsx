import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Archive, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { Button, Input } from '../../components/ui'

export default function LoginPage() {
  const { signIn, isAuthenticated, loading } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  if (!loading && isAuthenticated) return <Navigate to="/" replace />

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email wajib diisi'
    if (!form.password) e.password = 'Password wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    const { error } = await signIn(form.email, form.password)
    if (error) {
      toast.error('Email atau password salah')
      setErrors({ password: 'Email atau password salah' })
    } else {
      toast.success('Berhasil masuk')
      navigate('/')
    }
    setSubmitting(false)
  }

  return (
    <div
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      role="main"
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Logo BMU"
            className="w-14 h-14 rounded-2xl object-contain mx-auto mb-3 shadow-sm"
          />
          <h1 className="text-xl font-bold text-gray-900 tracking-wide">SIARSIP</h1>
          <p className="text-sm text-gray-500 mt-1">LPK Bahtera Mitra Unggulan</p>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <p className="text-sm font-medium text-gray-900 mb-5">Masuk ke sistem</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="login-email"
              label="Email"
              type="email"
              placeholder="admin@bmu.ac.id"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              error={errors.email}
              leftIcon={<Mail className="w-3.5 h-3.5" />}
              autoComplete="email"
              required
            />

            <Input
              id="login-password"
              label="Password"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              error={errors.password}
              leftIcon={<Lock className="w-3.5 h-3.5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              }
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={submitting}
            >
              Masuk
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-400">atau</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-50 border-gray-200"
            onClick={async () => {
              const { error } = await signInWithGoogle()
              if (error) toast.error('Gagal masuk via Google: ' + error.message)
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Masuk dengan Google
          </Button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Sistem internal — akses terbatas
        </p>
      </div>
    </div>
  )
}
