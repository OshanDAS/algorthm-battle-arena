import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../services/auth"
import { Eye, EyeOff, BookOpen, Shield } from "lucide-react"
import '../styles/mortal-kombat-theme.css'

export default function LoginPage() {
  // original states
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState("")
  const { login } = useAuth()
  const navigate = useNavigate()

  // UI-only state to disable form during login and show loader
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // keep your logic and console logs unchanged — only add the loading toggles
  async function onSubmit(e) {
    e.preventDefault()
    setStatus("Logging in...")
    setIsLoading(true)

          try {
            const { role } = await login(email, password)
            console.log(role)
            setStatus("Login successful!")
            setIsLoading(false)
            
            // Role-based navigation
            switch (role) {
              case 'Admin':
                navigate("/admin")
                break
              case 'Teacher':
                navigate("/teacher")
                break
              case 'Student':
                navigate("/student-dashboard")
                break
              default:
                navigate("/dashboard")
            }
          } catch (err) {      console.error("Login error:", err)
      const backendMsg = err.response?.data ?? err.message
      setStatus("Login failed: " + JSON.stringify(backendMsg))
      setIsLoading(false)
    }
  }

  return (
    // full-bleed background and prevent horizontal scroll (fixes grey bar)
    <div className="mk-arena flex items-center">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
        {/* two-column layout on lg+, full-width content stretched horizontally */}
        <div className="w-full lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-16 lg:items-center">
          {/* Left panel (info) - visible on large screens */}
          <div className="hidden lg:block space-y-8 xl:space-y-12">
            <div className="text-left">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-8 shadow-lg transform hover:scale-105 transition-transform">
                <BookOpen className="w-12 h-12 text-white" />
              </div>

              <h1 className="mk-title text-3xl xl:text-4xl mb-6 leading-tight">Welcome back, Warrior!</h1>
              <p className="text-gray-300 text-lg xl:text-xl leading-relaxed mb-8 mk-text-shadow">
                Log in to return to the arena and access your battles, rankings, and coding community.
              </p>

              <div className="space-y-4 xl:space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Secure Access</h3>
                    <p className="text-gray-600 text-sm">Your warrior account is fortified and protected</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Lightning Fast Entry</h3>
                    <p className="text-gray-600 text-sm">Jump straight back into the coding battlefield</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - form (stretches horizontally) */}
          <div className="w-full">
            {/* Mobile header */}
            <div className="text-center mb-6 sm:mb-8 lg:hidden">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg transform hover:scale-105 transition-transform">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
              <p className="text-gray-600 text-sm sm:text-base">Sign in to continue</p>
            </div>

            {/* translucent card */}
            <div
              className="mk-combat-frame p-6 sm:p-8 lg:p-10 xl:p-12"
              aria-hidden={isLoading ? "true" : "false"}
            >
              <form onSubmit={onSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label className="text-sm font-semibold text-yellow-400 block mb-2 mk-text-shadow">Email</label>
                  <input
                    type="email"
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/80 text-white border-2 border-yellow-600 rounded-lg transition-all duration-200 focus:outline-none text-sm sm:text-base focus:border-red-400 focus:shadow-md ${
                      isLoading ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="text-sm font-semibold text-yellow-400 block mb-2 mk-text-shadow">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 bg-black/80 text-white border-2 border-yellow-600 rounded-lg transition-all duration-200 focus:outline-none text-sm sm:text-base focus:border-red-400 focus:shadow-md ${
                        isLoading ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      disabled={isLoading}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-md ${
                        isLoading ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`mk-btn mk-btn-fight w-full py-3 sm:py-4 text-sm sm:text-base lg:text-lg flex justify-center items-center gap-2 sm:gap-3 ${
                      isLoading
                        ? "opacity-60 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 border-4 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                        <span>Logging in...</span>
                      </div>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span>Login</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Only show the status message when NOT loading — prevents the tiny "Logging in..." text from popping up */}
                {!isLoading && status && (
                  <p className="text-sm text-gray-600" aria-live="polite">
                    {status}
                  </p>
                )}

                {/* Footer link */}
                <div className="text-center pt-4 sm:pt-6 border-t border-gray-200">
                  <p className="text-gray-600 text-sm sm:text-base">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/register")}
                      disabled={isLoading}
                      className={`text-blue-600 font-semibold hover:text-blue-500 transition-colors underline decoration-2 underline-offset-2 ${
                        isLoading ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
