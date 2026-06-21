// src/pages/auth/Onboarding.jsx
// Profile completion — Guest: name only, Student: regNumber + free-text class/section

import { useState, useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../hooks/useAuth'
import { extractRegNumber } from '../../utils/formatters'
import christLogo from '../../assets/christ-logo.png'
import './Onboarding.css'

export default function Onboarding() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const isGuest = profile?.role === 'guest'

  // Auto-detect reg number from display name (only for students)
  const regNumber = useMemo(() => {
    if (isGuest) return ''
    return profile?.regNumber || extractRegNumber(user?.displayName) || ''
  }, [profile, user, isGuest])

  const [nameInput, setNameInput] = useState(user?.displayName || '')
  const [classInput, setClassInput] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e = {}
    if (isGuest) {
      if (!nameInput.trim()) e.name = 'Name is required'
    } else {
      // Student validation
      if (!regNumber) e.regNumber = 'Could not detect registration number. Contact admin.'
      if (!classInput.trim()) e.classSection = 'Class/Section is required (e.g. 4BTCSA)'
    }
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setLoading(true)
    try {
      if (isGuest) {
        // Guest onboarding — just name
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: nameInput.trim(),
          email: user.email,
          photoURL: user.photoURL,
          role: 'guest',
          onboarded: true,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      } else {
        // Student onboarding — regNumber + class/section
        const classSection = classInput.trim().toUpperCase()

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          regNumber,
          class: classSection,
          section: classSection,
          role: 'user',
          onboarded: true,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error(err)
      setErrors({ submit: 'Failed to save profile. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="onboarding-page">
      {/* Ambient glow */}
      <div className="onboarding-glow" />

      <div className="onboarding-card">
        {/* Header */}
        <div className="onboarding-header">
          <img src={christLogo} alt="Christ University" className="onboarding-logo" />
          <h1 className="onboarding-title">Complete your profile</h1>
          <p className="onboarding-subtitle">
            Hey {user?.displayName?.split(' ')[0] || 'there'}! Just a few details to get you in.
          </p>
          {isGuest && (
            <span className="onboarding-role-badge onboarding-role-badge--guest">Guest</span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          {isGuest ? (
            /* ====== GUEST FLOW ====== */
            <div className="form-group">
              <label className="form-label">
                Your Name <span className="form-required">*</span>
              </label>
              <input
                id="guestName"
                type="text"
                value={nameInput}
                onChange={(e) => { setNameInput(e.target.value); setErrors(prev => ({ ...prev, name: '' })) }}
                placeholder="Enter your name"
                className={`form-input ${errors.name ? 'form-input--error' : ''}`}
              />
              {errors.name ? (
                <p className="form-error">{errors.name}</p>
              ) : (
                <p className="form-hint">
                  This will be displayed on your profile
                </p>
              )}
            </div>
          ) : (
            /* ====== STUDENT FLOW ====== */
            <>
              {/* Registration Number — Auto-detected, Read-only */}
              <div className="form-group">
                <label className="form-label">Registration Number</label>
                <input
                  id="regNumber"
                  type="text"
                  value={regNumber}
                  readOnly
                  className="form-input form-input--readonly"
                />
                <p className="form-hint form-hint--success">
                  <svg className="form-hint__check" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Auto-detected from your Christ email
                </p>
                {errors.regNumber && (
                  <p className="form-error">{errors.regNumber}</p>
                )}
              </div>

              {/* Class/Section — Free text input */}
              <div className="form-group">
                <label className="form-label">
                  Class / Section <span className="form-required">*</span>
                </label>
                <input
                  id="classSection"
                  name="classSection"
                  type="text"
                  value={classInput}
                  onChange={(e) => { setClassInput(e.target.value); setErrors(prev => ({ ...prev, classSection: '' })) }}
                  placeholder="e.g. 4BTCSA, 4BTCSIOT, 5BTELCSC"
                  className={`form-input ${errors.classSection ? 'form-input--error' : ''}`}
                />
                {errors.classSection ? (
                  <p className="form-error">{errors.classSection}</p>
                ) : (
                  <p className="form-hint">
                    Enter your full class code (semester + branch + section)
                  </p>
                )}
              </div>
            </>
          )}

          {/* Submit error */}
          {errors.submit && (
            <p className="form-error form-error--box">{errors.submit}</p>
          )}

          {/* Submit */}
          <button
            id="onboarding-submit-btn"
            type="submit"
            disabled={loading}
            className="onboarding-submit"
          >
            {loading ? (
              <>
                <div className="spinner spinner--small" />
                Saving...
              </>
            ) : (
              'Complete Setup →'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

