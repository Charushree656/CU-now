// src/pages/user/Profile.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import ConfirmModal from '../../components/ConfirmModal'
import './Profile.css'

export default function Profile() {
  const { user, profile, isAdmin } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  async function handleLogout() {
    try {
      await signOut(auth)
      navigate('/login', { replace: true })
    } catch {
      console.error('Failed to log out')
    }
  }

  const firstName = user?.displayName?.split(' ')[0] || 'User'
  const isGuest = profile?.role === 'guest'

  // Friendly role label
  function getRoleLabel(role) {
    switch (role) {
      case 'guest': return 'Guest'
      case 'admin': return 'Admin'
      case 'user': return 'Student'
      default: return role || 'User'
    }
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-header__inner">
          <h1 className="profile-header__title">Profile</h1>
        </div>
      </div>

      <div className="profile-content">
        {/* Avatar + Name */}
        <div className="profile-card profile-user-card">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="profile-avatar" />
          ) : (
            <div className="profile-avatar profile-avatar--placeholder">
              {firstName.charAt(0)}
            </div>
          )}
          <div className="profile-user-info">
            <h2 className="profile-name">{user?.displayName}</h2>
            <p className="profile-email">{user?.email}</p>
            {isAdmin && (
              <span className="profile-admin-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Admin
              </span>
            )}
            {isGuest && (
              <span className="profile-guest-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                Guest
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="profile-card">
          <h3 className="profile-section-title">Details</h3>
          <div className="profile-rows">
            <ProfileRow
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              label="Role"
              value={getRoleLabel(profile?.role)}
            />
            {!isGuest && (
              <>
                <ProfileRow
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M7 4v6"/></svg>}
                  label="Reg. Number"
                  value={profile?.regNumber || '—'}
                />
                <ProfileRow
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>}
                  label="Class / Section"
                  value={profile?.class || profile?.section || '—'}
                />
              </>
            )}
            <ProfileRow
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>}
              label="Email"
              value={user?.email || '—'}
            />
          </div>
        </div>

        {/* Admin Panel Entry */}
        {isAdmin && (
          <button className="admin-panel-btn" onClick={() => navigate('/admin')}>
            <div className="admin-panel-btn__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="admin-panel-btn__text">
              <p className="admin-panel-btn__title">Admin Panel</p>
              <p className="admin-panel-btn__sub">Manage events & announcements</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* Settings */}
        <div className="profile-card">
          <h3 className="profile-section-title">Settings</h3>

          <button className="profile-setting" onClick={toggleTheme}>
            <div className="profile-setting__icon">
              {isDark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </div>
            <span className="profile-setting__label">Appearance</span>
            <div className={`theme-toggle ${isDark ? 'theme-toggle--dark' : ''}`}>
              <div className="theme-toggle__knob" />
            </div>
          </button>

          <button className="profile-setting profile-setting--danger" onClick={() => setShowLogoutModal(true)}>
            <div className="profile-setting__icon profile-setting__icon--danger">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="profile-setting__label--danger">Log out</span>
          </button>
        </div>

        <p className="profile-version">By, Developers Society of Christ University</p>
      </div>

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Log out"
        message="Are you sure you want to log out?"
        confirmText="Log out"
        isDestructive={true}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

    </div>
  )
}

function ProfileRow({ icon, label, value }) {
  return (
    <div className="profile-row">
      <div className="profile-row__icon">{icon}</div>
      <div className="profile-row__content">
        <p className="profile-row__label">{label}</p>
        <p className="profile-row__value">{value}</p>
      </div>
    </div>
  )
}
