// src/pages/auth/Login.jsx
// Premium Christ University CU Now login page
// Supports Student, Guest, and Admin login modes

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../../firebase'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import { extractRegNumber, extractCleanName } from '../../utils/formatters'

// Assets
import christLogo from '../../assets/christ-logo.png'
import bgLight from '../../assets/bg-light.png'
import bgDark from '../../assets/bg-dark.png'

// Scoped styles
import './Login.css'

const ALLOWED_DOMAIN = 'christuniversity.in'
const LOGIN_MODE_KEY = 'cu-now-login-mode'

/* ---- Auth helpers ---- */

function authErrorMessage(code) {
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.'
    case 'auth/popup-blocked':
      return 'Popup was blocked. Redirecting to Google sign-in...'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Auth.'
    case 'auth/invalid-domain':
      return 'Only Christ University email IDs (@christuniversity.in) are allowed for student login.'
    default:
      return 'Sign-in failed. Please try again.'
  }
}

async function ensureStudentProfile(firebaseUser, navigate) {
  // Enforce Christ University email domain for students
  if (!firebaseUser.email?.endsWith(ALLOWED_DOMAIN)) {
    await signOut(auth)
    throw { code: 'auth/invalid-domain' }
  }

  const userRef = doc(db, 'users', firebaseUser.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    const regNumber = extractRegNumber(firebaseUser.displayName)
    const cleanName = extractCleanName(firebaseUser.displayName)

    await setDoc(userRef, {
      uid: firebaseUser.uid,
      name: cleanName,
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL,
      regNumber,
      role: 'user',
      onboarded: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    navigate('/onboarding', { replace: true })
    return
  }

  const data = userSnap.data()
  if (data.role === 'pending_admin' || data.adminStatus === 'pending' || data.adminStatus === 'rejected') {
    navigate('/admin-onboarding', { replace: true })
  } else if (!data.onboarded) navigate('/onboarding', { replace: true })
  else if (data.role === 'admin') navigate('/admin', { replace: true })
  else navigate('/dashboard', { replace: true })
}

async function ensureGuestProfile(firebaseUser, navigate) {
  // No domain restriction for guests — any email allowed
  const userRef = doc(db, 'users', firebaseUser.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || '',
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL,
      role: 'guest',
      onboarded: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    navigate('/onboarding', { replace: true })
    return
  }

  const data = userSnap.data()
  if (!data.onboarded) navigate('/onboarding', { replace: true })
  else navigate('/dashboard', { replace: true })
}

async function ensureAdminProfile(firebaseUser, navigate) {
  const userRef = doc(db, 'users', firebaseUser.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || '',
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL,
      role: 'pending_admin',
      adminStatus: 'draft',
      designation: '',
      organization: '',
      adminRequestReason: '',
      onboarded: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    navigate('/admin-onboarding', { replace: true })
    return
  }

  const data = userSnap.data()
  if (data.role === 'admin' && data.onboarded) {
    navigate('/admin', { replace: true })
    return
  }

  navigate('/admin-onboarding', { replace: true })
}

/* ---- Inline SVG Icons ---- */

function GoogleIcon() {
  return (
    <svg className="google-icon" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function UserIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function GlobeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
}

function LockIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function ShieldCheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  )
}

/* ================================================================
   LOGIN COMPONENT
   ================================================================ */

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [loginMode, setLoginMode] = useState('student')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user, profile, loading: authLoading, isAdmin, isOnboarded } = useAuth()
  const { isDark } = useTheme()

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (authLoading || !user || !profile) return
    if (profile.role === 'pending_admin' || profile.adminStatus === 'pending' || profile.adminStatus === 'rejected') {
      navigate('/admin-onboarding', { replace: true })
    } else if (!isOnboarded) navigate('/onboarding', { replace: true })
    else if (isAdmin) navigate('/admin', { replace: true })
    else navigate('/dashboard', { replace: true })
  }, [authLoading, user, profile, isAdmin, isOnboarded, navigate])

  // Handle redirect result (mobile Safari fallback)
  useEffect(() => {
    let mounted = true

    async function finishRedirectSignIn() {
      try {
        const result = await getRedirectResult(auth)
        if (!result || !mounted) return
        const mode = sessionStorage.getItem(LOGIN_MODE_KEY) || 'student'
        if (mode === 'admin') await ensureAdminProfile(result.user, navigate)
        else if (mode === 'guest') await ensureGuestProfile(result.user, navigate)
        else await ensureStudentProfile(result.user, navigate)
      } catch (err) {
        console.error(err)
        if (mounted) setError(authErrorMessage(err.code))
      }
    }

    finishRedirectSignIn()
    return () => {
      mounted = false
    }
  }, [navigate])

  async function handleGoogleSignIn(mode) {
    setLoading(true)
    setLoginMode(mode)
    setError('')
    sessionStorage.setItem(LOGIN_MODE_KEY, mode)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      if (mode === 'admin') await ensureAdminProfile(result.user, navigate)
      else if (mode === 'guest') await ensureGuestProfile(result.user, navigate)
      else await ensureStudentProfile(result.user, navigate)
    } catch (err) {
      console.error(err)
      setError(authErrorMessage(err.code))
      if (err.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider)
      }
    } finally {
      setLoading(false)
    }
  }

  // Full-screen spinner while checking auth state
  if (authLoading || (user && profile)) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    )
  }

  // Card config per mode
  const cardConfig = {
    student: {
      title: 'Student Login',
      action: 'Continue with Google',
      role: 'For Christ University students',
      support: 'Quick and secure access with your Christ University account',
      supportIcon: <UserIcon className="login-card__support-icon" />,
      btnId: 'student-signin-btn',
      cardClass: 'login-card-single--student',
      iconClass: 'login-card__icon--student',
      btnClass: 'login-btn--student',
    },
    guest: {
      title: 'Guest Login',
      action: 'Continue with Google',
      role: 'For visitors & outsiders',
      support: 'Sign in with any Google account to explore campus events',
      supportIcon: <GlobeIcon className="login-card__support-icon" />,
      btnId: 'guest-signin-btn',
      cardClass: 'login-card-single--guest',
      iconClass: 'login-card__icon--guest',
      btnClass: 'login-btn--guest',
    },
    admin: {
      title: 'Admin Login',
      action: 'Sign in with Google',
      role: 'For faculty & administrators',
      support: 'Secure access for event creators and managers',
      supportIcon: <LockIcon className="login-card__support-icon" />,
      btnId: 'admin-signin-btn',
      cardClass: 'login-card-single--admin',
      iconClass: 'login-card__icon--admin',
      btnClass: 'login-btn--admin',
    },
  }

  const cfg = cardConfig[loginMode]

  // Compute slider position for 3-way toggle
  const sliderClass = loginMode === 'guest' ? 'login-toggle__slider--center' : loginMode === 'admin' ? 'login-toggle__slider--right' : ''

  return (
    <div className="login-page">
      {/* ===== BACKGROUND SYSTEM ===== */}
      <div className="login-bg login-bg-animate">
        <img
          src={isDark ? bgDark : bgLight}
          alt=""
          className="login-bg__img login-bg__drift"
          draggable={false}
          aria-hidden="true"
        />
        <div className={`login-bg__overlay ${isDark ? 'login-bg__overlay--dark' : 'login-bg__overlay--light'}`} />
        <div className="login-bg__frost" />
        <div className="login-bg__blur-top" />
        {isDark && <div className="login-bg__glow" />}
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="login-content">

        {/* ---- LOGO ---- */}
        <img
          src={christLogo}
          alt="Christ University"
          className="login-logo login-animate-in login-animate-in--logo"
          draggable={false}
        />

        {/* ---- TITLE ---- */}
        <h1 className="login-title login-animate-in login-animate-in--title">
          CU Now
        </h1>

        <p className="login-subtitle login-animate-in login-animate-in--subtitle">
          Stay on time. Stay informed. Stay ahead.
        </p>

        {/* ---- Diamond separator ---- */}
        <div className="login-diamond login-animate-in login-animate-in--diamond">
          <span className="login-diamond__line" />
          <span className="login-diamond__icon" />
          <span className="login-diamond__line" />
        </div>

        <p className="login-description login-animate-in login-animate-in--desc">
          Choose how you want to sign in to explore campus events and navigation.
        </p>

        {/* ---- SEGMENTED TOGGLE (3-way) ---- */}
        <div className="login-toggle login-animate-in login-animate-in--cards">
          <div className="login-toggle__track login-toggle__track--three">
            <div
              className={`login-toggle__slider login-toggle__slider--third ${sliderClass}`}
            />
            <button
              type="button"
              className={`login-toggle__btn ${loginMode === 'student' ? 'login-toggle__btn--active' : ''}`}
              onClick={() => { setLoginMode('student'); setError('') }}
            >
              <span>Student</span>
            </button>
            <button
              type="button"
              className={`login-toggle__btn ${loginMode === 'guest' ? 'login-toggle__btn--active' : ''}`}
              onClick={() => { setLoginMode('guest'); setError('') }}
            >
              <span>Guest</span>
            </button>
            <button
              type="button"
              className={`login-toggle__btn ${loginMode === 'admin' ? 'login-toggle__btn--active' : ''}`}
              onClick={() => { setLoginMode('admin'); setError('') }}
            >
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* ---- ADAPTIVE LOGIN CARD ---- */}
        <div className={`login-card-single login-animate-in login-animate-in--cards ${cfg.cardClass}`}>
          <div className="login-card__content" key={loginMode}>
            {/* Icon */}
            <div className={`login-card__icon ${cfg.iconClass}`}>
              <GoogleIcon />
            </div>

            <span className="login-card__title">
              {cfg.title}
            </span>
            <span className="login-card__action">
              {cfg.action}
            </span>
            <span className="login-card__role">
              {cfg.role}
            </span>

            {/* Support text */}
            <div className="login-card__support">
              {cfg.supportIcon}
              <span className="login-card__support-text">
                {cfg.support}
              </span>
            </div>

            {/* CTA */}
            <button
              id={cfg.btnId}
              onClick={() => handleGoogleSignIn(loginMode)}
              disabled={loading}
              className={`login-btn ${cfg.btnClass}`}
            >
              {loading ? (
                <div className="login-spinner" />
              ) : (
                <>
                  {cfg.action}
                  <span className="login-btn__arrow">→</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ---- ERROR MESSAGE ---- */}
        {error && (
          <div className="login-error login-animate-in">
            <span className="login-error__icon">⚠️</span>
            <p className="login-error__text">{error}</p>
          </div>
        )}

        {/* ---- SECURITY BADGE ---- */}
        <a href="https://drive.google.com/file/d/1800aQog5PJE6LwwWvFE0_2mk0nEyoVIl/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="login-security login-animate-in login-animate-in--security">
          <ShieldCheckIcon className="login-security__icon" />
          <span className="login-security__text">
            Secure platform. Click to view Privacy Policy.
          </span>
        </a>

        {/* ---- FOOTER ---- */}
        <p className="login-footer login-animate-in login-animate-in--footer">
          By, The Developers Society of Christ University
        </p>

      </div>
    </div>
  )
}
