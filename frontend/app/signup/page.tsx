'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight, ArrowLeft, Rocket, GraduationCap, Briefcase } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT' as 'FOUNDER' | 'STUDENT' | 'INVESTOR',
    startupName: '',
    college: '',
    city: '',
    firm: '',
    skills: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all fields')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }
    }
    setError('')
    setStep(prev => prev + 1)
  }

  const handleBack = () => {
    setError('')
    setStep(prev => prev - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const result = await signUp({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      role: formData.role,
      college: formData.college,
      city: formData.city
    })
    
    if (result.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#111111',
    border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 10,
    padding: '12px 16px',
    fontFamily: 'Inter, sans-serif',
    fontSize: 15,
    color: '#e4e4e4',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    fontFamily: 'Inter', fontSize: 12,
    color: '#6b6b6b', marginBottom: 6,
    display: 'block',
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      {/* Beacon background */}
      <div style={{
        position: 'fixed',
        top: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: 600, height: '60vh',
        background: 'radial-gradient(ellipse, rgba(200,241,53,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: 40,
          position: 'relative',
          zIndex: 10,
          overflow: 'hidden'
        }}
      >
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= step ? '#c8f135' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s ease'
            }} />
          ))}
        </div>

        {/* Back Button */}
        {step > 1 && (
          <button
            onClick={handleBack}
            style={{
              position: 'absolute', top: 40, left: 40,
              background: 'none', border: 'none',
              color: '#6b6b6b', cursor: 'pointer',
              padding: 0, display: 'flex', alignItems: 'center'
            }}
          >
            <ArrowLeft size={20} />
          </button>
        )}

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 24, fontWeight: 800,
            }}>
              <span style={{ color: '#ffffff' }}>Dev</span>
              <span style={{ color: '#c8f135' }}>Up</span>
            </span>
          </Link>
        </div>

        {/* Header */}
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 28, fontWeight: 800,
          color: '#ffffff', marginBottom: 8,
          textAlign: 'center',
        }}>
          {step === 1 && "Create your account"}
          {step === 2 && "Choose your path"}
          {step === 3 && "Tell us more"}
        </h1>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 14, color: '#6b6b6b',
          textAlign: 'center', marginBottom: 32,
        }}>
          {step === 1 && "Join the fastest growing startup ecosystem."}
          {step === 2 && "How are you looking to use DevUp?"}
          {step === 3 && "Help us personalize your experience."}
        </p>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '12px 16px',
            marginBottom: 20,
            fontFamily: 'Inter', fontSize: 13,
            color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Full name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Email address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="you@startup.com"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 16, position: 'relative' }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••"
                    style={{ ...inputStyle, paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 14,
                      top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      color: '#6b6b6b', cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: 24, position: 'relative' }}>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {[
                { id: 'FOUNDER', icon: <Rocket />, title: 'Founder', subtitle: "I'm building a startup" },
                { id: 'STUDENT', icon: <GraduationCap />, title: 'Student / Talent', subtitle: "I'm looking for opportunities" },
                { id: 'INVESTOR', icon: <Briefcase />, title: 'Investor', subtitle: "I'm looking to invest" }
              ].map(role => (
                <div
                  key={role.id}
                  onClick={() => setFormData({...formData, role: role.id as any})}
                  style={{
                    padding: 20,
                    borderRadius: 14,
                    border: `2px solid ${formData.role === role.id ? '#c8f135' : 'rgba(255,255,255,0.08)'}`,
                    background: formData.role === role.id ? 'rgba(200,241,53,0.05)' : '#111111',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: formData.role === role.id ? '#c8f135' : 'rgba(255,255,255,0.05)',
                    color: formData.role === role.id ? '#000' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {role.icon}
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 4px 0' }}>{role.title}</h3>
                    <p style={{ fontFamily: 'Inter', fontSize: 13, color: '#6b6b6b', margin: 0 }}>{role.subtitle}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              
              {formData.role === 'FOUNDER' && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Startup Name (Optional)</label>
                    <input type="text" value={formData.startupName} onChange={e => setFormData({...formData, startupName: e.target.value})} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}>City</label>
                    <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} style={inputStyle} placeholder="e.g. San Francisco, CA" />
                  </div>
                </>
              )}

              {formData.role === 'STUDENT' && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>College / University</label>
                    <input type="text" value={formData.college} onChange={e => setFormData({...formData, college: e.target.value})} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>City</label>
                    <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}>Top Skills (comma separated)</label>
                    <input type="text" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} style={inputStyle} placeholder="e.g. React, Node.js, Design" />
                  </div>
                </>
              )}

              {formData.role === 'INVESTOR' && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Firm Name (Optional)</label>
                    <input type="text" value={formData.firm} onChange={e => setFormData({...formData, firm: e.target.value})} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}>City</label>
                    <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} style={inputStyle} />
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Submit/Next */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', height: 48,
              background: loading ? '#6b6b6b' : '#c8f135',
              color: '#000000', border: 'none',
              borderRadius: 10,
              fontFamily: 'Inter', fontSize: 15,
              fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Processing...' : step === 3 ? 'Complete Sign Up' : 'Continue'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {step === 1 && (
          <p style={{ textAlign: 'center', fontFamily: 'Inter', fontSize: 14, color: '#6b6b6b', marginTop: 24 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#c8f135', textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        )}
      </motion.div>
    </main>
  )
}
