import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const isLogin = location.pathname === '/login'
  const { signIn, signUp } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password)
        if (error) throw error
        navigate('/')
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match')
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }
        if (!/^\+?[0-9]{10,13}$/.test(formData.phone.replace(/\s/g, ''))) {
          throw new Error('Please enter a valid phone number')
        }
        const { error } = await signUp(
          formData.email,
          formData.password,
          formData.phone,
          formData.firstName,
          formData.lastName
        )
        if (error) throw error
        navigate('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex pt-16">
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-6">
              <span className="text-3xl font-black tracking-[0.15em] text-white">SOLÈNE</span>
            </Link>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-gray-400 mt-2">
              {isLogin ? 'Sign in to continue' : 'Join the community'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-transparent border border-white/20 text-white rounded focus:border-rose-400 focus:outline-none transition-colors"
                      placeholder="Ananya"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-transparent border border-white/20 text-white rounded focus:border-rose-400 focus:outline-none transition-colors"
                      placeholder="Sharma"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 bg-transparent border border-white/20 text-white rounded focus:border-rose-400 focus:outline-none transition-colors placeholder:text-gray-600"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 bg-transparent border border-white/20 text-white rounded focus:border-rose-400 focus:outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-transparent border border-white/20 text-white rounded focus:border-rose-400 focus:outline-none transition-colors pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-[11px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-transparent border border-white/20 text-white rounded focus:border-rose-400 focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <div className="p-4 border border-red-500/20 bg-red-500/5 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white text-black text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-rose-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'PLEASE WAIT...' : isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <Link
                to={isLogin ? '/signup' : '/login'}
                className="font-bold text-white hover:text-rose-400 ml-2 transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-gray-600">
            By continuing, you agree to our{' '}
            <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/9995084/pexels-photo-9995084.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="Solène"
            className="w-full h-full object-cover grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/50 to-black" />
        </div>
        <div className="relative h-full flex items-end p-12">
          <div className="max-w-md">
            <h2 className="text-5xl font-black text-white tracking-tight mb-4">
              MOVE WITH<br/>
              <span className="text-rose-400">INTENTION</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Athleisure and officewear designed for the woman who does both, well.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
