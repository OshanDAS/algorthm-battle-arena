"use client"

import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { createApiClient } from "../api"
import { Eye, EyeOff, GraduationCap, Users, BookOpen, Shield, CheckCircle } from "lucide-react"

/** Password strength helper - unchanged logic */
const PasswordStrengthIndicator = ({ password }) => {
  const getStrength = (pw) => {
    let score = 0
    if (!pw) return 0
    if (pw.length >= 8) score++
    if (/[a-z]/.test(pw)) score++
    if (/[A-Z]/.test(pw)) score++
    if (/\d/.test(pw)) score++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++
    return score
  }

  const strength = getStrength(password)
  const getColor = () => {
    if (strength <= 2) return "bg-red-500"
    if (strength <= 3) return "bg-amber-500"
    return "bg-emerald-500"
  }
  const getTextColor = () => {
    if (strength <= 2) return "text-red-600"
    if (strength <= 3) return "text-amber-600"
    return "text-emerald-600"
  }
  const getLabel = () => {
    if (strength <= 2) return "Weak"
    if (strength <= 3) return "Medium"
    return "Strong"
  }

  if (!password) return null

  return (
    <div className="mt-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600 font-medium">Password strength</span>
        <span className={`text-sm font-semibold ${getTextColor()}`}>{getLabel()}</span>
      </div>

      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getColor()}`}
          style={{ width: `${(strength / 5) * 100}%` }}
        />
      </div>
    </div>
  )
}

/** Main RegisterPage component */
export default function RegisterPage() {
  const navigate = useNavigate()
  const api = createApiClient()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState("Student")
  const [formData, setFormData] = useState({
    role: "Student",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    passwordConfirm: "",
  })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  const validatePassword = (value) => {
    if (value.length < 8) return "At least 8 characters required"
    if (!/[a-z]/.test(value)) return "Must include a lowercase letter"
    if (!/[A-Z]/.test(value)) return "Must include an uppercase letter"
    if (!/\d/.test(value)) return "Must include a number"
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return "Must include a special character"
    return ""
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format"

    const passwordError = validatePassword(formData.password)
    if (passwordError) newErrors.password = passwordError
    if (formData.password !== formData.passwordConfirm) newErrors.passwordConfirm = "Passwords do not match"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setFormData((prev) => ({ ...prev, role }))
  }

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setStatusMessage("")
    if (!validateForm()) return

    setIsLoading(true)
    setStatusMessage("Registering...")

    const dto = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      passwordConfirm: formData.passwordConfirm,
    }

    try {
      if (selectedRole === "Student") {
        await api.registerStudent(dto)
      } else {
        await api.registerTeacher(dto)
      }

      setStatusMessage("Registered successfully! Redirecting...")
      setSuccess(true)
      // keep loading state off for clarity in modal
      setIsLoading(false)
    } catch (err) {
      const backendMsg = err?.response?.data || err?.message || err
      setStatusMessage("Registration failed: " + JSON.stringify(backendMsg))
      console.error("Registration error:", err)
      setIsLoading(false)
    }
  }

  // When success appears, auto-redirect after a short delay (same UX as your original)
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => {
      navigate("/") // same as original snippet; change if you want "/dashboard"
    }, 1200)
    return () => clearTimeout(t)
  }, [success, navigate])

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 relative">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="w-full lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-16 lg:items-center">
          {/* Left info panel (visible lg+) */}
          <div className="hidden lg:block space-y-8 xl:space-y-12">
            <div className="text-left">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-8 shadow-lg transform hover:scale-105 transition-transform">
                <BookOpen className="w-12 h-12 text-white" />
              </div>

              <h1 className="text-4xl xl:text-5xl font-bold text-gray-900 mb-6 leading-tight">Join Our Learning Community</h1>
              <p className="text-gray-600 text-lg xl:text-xl leading-relaxed mb-8">
                Create your account to get started on your educational journey and unlock access to world-class learning resources.
              </p>

              <div className="space-y-4 xl:space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Expert-Led Courses</h3>
                    <p className="text-gray-600 text-sm">Learn from industry professionals</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Community Support</h3>
                    <p className="text-gray-600 text-sm">Connect with fellow learners</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Secure Platform</h3>
                    <p className="text-gray-600 text-sm">Your data is safe with us</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - form */}
          <div className="w-full">
            <div className="text-center mb-6 sm:mb-8 lg:hidden">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg transform hover:scale-105 transition-transform">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Join Our Learning Community</h1>
              <p className="text-gray-600 text-sm sm:text-base">Create your account to get started on your educational journey</p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-white/90 backdrop-blur-sm border border-white/50 shadow-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 xl:p-12 space-y-6 sm:space-y-8 relative"
            >
              <div className="space-y-4">
                <label className="text-sm sm:text-base font-bold text-gray-700 block">I am a</label>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { role: "Student", icon: GraduationCap, color: "from-blue-500 to-cyan-500" },
                    { role: "Teacher", icon: Users, color: "from-purple-500 to-pink-500" },
                  ].map(({ role, icon: Icon, color }) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleSelect(role)}
                      className={`relative p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl flex flex-col items-center gap-2 sm:gap-3 font-semibold border-2 transition-all duration-300 transform ${
                        selectedRole === role
                          ? `bg-gradient-to-r ${color} text-white border-transparent shadow-xl scale-105`
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md hover:scale-105"
                      }`}
                    >
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                      <span className="text-xs sm:text-sm">{role}</span>

                      {selectedRole === role && (
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "First Name", name: "firstName", placeholder: "Enter first name" },
                    { label: "Last Name", name: "lastName", placeholder: "Enter last name" },
                  ].map((field) => (
                    <div key={field.name} className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">{field.label}</label>
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        value={formData[field.name]}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 text-gray-900 border-2 rounded-lg sm:rounded-xl transition-all duration-200 focus:outline-none text-sm sm:text-base ${
                          errors[field.name] ? "border-red-300 focus:border-red-400 focus:bg-red-50" : "border-gray-200 focus:border-blue-400 focus:bg-white focus:shadow-md"
                        }`}
                      />
                      {errors[field.name] && (
                        <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                          <span className="w-1 h-1 bg-red-500 rounded-full" />
                          {errors[field.name]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 text-gray-900 border-2 rounded-lg sm:rounded-xl transition-all duration-200 focus:outline-none text-sm sm:text-base ${
                      errors.email ? "border-red-300 focus:border-red-400 focus:bg-red-50" : "border-gray-200 focus:border-blue-400 focus:bg-white focus:shadow-md"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 bg-gray-50 text-gray-900 border-2 rounded-lg sm:rounded-xl transition-all duration-200 focus:outline-none text-sm sm:text-base ${
                          errors.password ? "border-red-300 focus:border-red-400 focus:bg-red-50" : "border-gray-200 focus:border-blue-400 focus:bg-white focus:shadow-md"
                        }`}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-md"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </button>
                    </div>

                    <PasswordStrengthIndicator password={formData.password} />

                    {errors.password && (
                      <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.passwordConfirm}
                        onChange={(e) => handleInputChange("passwordConfirm", e.target.value)}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 bg-gray-50 text-gray-900 border-2 rounded-lg sm:rounded-xl transition-all duration-200 focus:outline-none text-sm sm:text-base ${
                          errors.passwordConfirm ? "border-red-300 focus:border-red-400 focus:bg-red-50" : "border-gray-200 focus:border-blue-400 focus:bg-white focus:shadow-md"
                        }`}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-md"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </button>
                    </div>

                    {errors.passwordConfirm && (
                      <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full" />
                        {errors.passwordConfirm}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base lg:text-lg flex justify-center items-center gap-2 sm:gap-3 transition-all duration-300 transform ${
                      isLoading ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 border-4 border-gray-400 border-t-gray-600 rounded-full animate-spin" />
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </div>

                {statusMessage && (
                  <p className="text-sm text-gray-600" aria-live="polite">
                    {statusMessage}
                  </p>
                )}
              </div>

              <div className="text-center pt-4 sm:pt-6 border-t border-gray-200">
                <p className="text-gray-600 text-sm sm:text-base">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-blue-600 font-semibold hover:text-blue-500 transition-colors underline decoration-2 underline-offset-2"
                    onClick={() => {
                      navigate("/login")
                    }}
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Success modal overlay (blur + semi-transparent), covers entire screen and blocks interaction */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop: semi-transparent + blur */}
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" aria-hidden="true" />

          {/* Modal card */}
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center gap-4"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-full shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Welcome aboard!</h2>
            <p className="text-sm sm:text-base text-gray-600 text-center">Your account was created successfully. Redirecting you now…</p>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition"
              >
                Continue
              </button>

              <button
                onClick={() => {
                  // Allow user to dismiss modal and stay on the page if they want to continue exploring
                  setSuccess(false)
                  setStatusMessage("")
                }}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:shadow-sm transition"
              >
                Stay on this page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
