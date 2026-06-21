// src/pages/user/Dashboard.jsx
// Home dashboard — "Happening Now" + "Up Next" sections

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useEvents } from '../../context/EventsContext'
import { useUnreadAnnouncements } from '../../hooks/useUnreadAnnouncements'
import { formatTime, getCountdown } from '../../utils/formatters'
import { getVenueByName } from '../../data/venues'
import VenueDirections from '../../components/VenueDirections'
import christLogo from '../../assets/christ-logo.png'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, profile, isAdmin } = useAuth()
  const { hasUnread } = useUnreadAnnouncements()
  const { events, loading } = useEvents()
  const [now, setNow] = useState(new Date())
  const [selectedVenueEvent, setSelectedVenueEvent] = useState(null)

  // Live clock — update every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  // Filter active events — all users see all events (group filtering removed)
  const activeEvents = useMemo(() => {
    return events.filter(e => e.status === 'active')
  }, [events])

  const happeningNow = useMemo(() => {
    return activeEvents.filter(e => {
      const start = e.startTime?.toDate ? e.startTime.toDate() : new Date(e.startTime)
      const end = e.endTime?.toDate ? e.endTime.toDate() : new Date(e.endTime)
      return now >= start && now <= end
    })
  }, [activeEvents, now])

  const upNext = useMemo(() => {
    return activeEvents.filter(e => {
      const start = e.startTime?.toDate ? e.startTime.toDate() : new Date(e.startTime)
      return start > now
    }).slice(0, 3)
  }, [activeEvents, now])

  const firstName = user?.displayName?.split(' ')[0] || 'there'

  // Day of week display
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayName = dayNames[now.getDay()]

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header__inner">
          <div className="dashboard-header__left" onClick={() => navigate('/profile')}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="dashboard-avatar" />
            ) : (
              <div className="dashboard-avatar dashboard-avatar--placeholder">
                {firstName.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="dashboard-greeting">Hey, {firstName}</h1>
              <p className="dashboard-date">{todayName} · {profile?.role === 'guest' ? 'Guest' : 'Campus Events'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {profile?.feedbackSkippedAt && !profile?.hasSubmittedFeedback && (
              <button 
                className="dashboard-feedback-btn" 
                onClick={() => window.dispatchEvent(new Event('showFeedbackPopup'))}
                title="Provide Feedback"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                <span className="dashboard-feedback-dot"></span>
              </button>
            )}
            <img src={christLogo} alt="Christ" className="dashboard-logo" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {loading ? (
          <div className="dashboard-skeleton">
            <div className="skeleton-block skeleton-block--lg" />
            <div className="skeleton-block skeleton-block--md" />
            <div className="skeleton-block skeleton-block--md" />
          </div>
        ) : (
          <>
            {/* ===== ANNOUNCEMENT BANNER ===== */}
            {hasUnread && (
              <div className="dashboard-alert" onClick={() => navigate('/announcements')}>
                <span className="dashboard-alert__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                </span>
                <div className="dashboard-alert__content">
                  <p className="dashboard-alert__title">New Update Available</p>
                  <p className="dashboard-alert__desc">Kindly check the updates section for new announcements.</p>
                </div>
                <svg className="dashboard-alert__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            )}

            {/* ===== HAPPENING NOW ===== */}
            <section className="dashboard-section">
              <div className="section-header">
                <div className="section-header__dot section-header__dot--live" />
                <h2 className="section-title">Happening Now</h2>
              </div>

              {happeningNow.length > 0 ? (
                happeningNow.map(event => (
                  <div key={event.id} className="now-card">
                    <div className="now-card__badge">LIVE</div>
                    <h3 className="now-card__name">{event.name}</h3>
                    <div className="now-card__details">
                      <div className="now-card__detail">
                        <svg className="now-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>{event.venue}</span>
                      </div>
                      <div className="now-card__detail">
                        <svg className="now-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>{formatTime(event.startTime)} – {formatTime(event.endTime)}</span>
                      </div>
                    </div>
                    {event.description && (
                      <p className="now-card__desc">{event.description}</p>
                    )}
                    <div className="now-card__countdown">
                      <svg className="now-card__countdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Ends in {getCountdown(event.endTime)}
                    </div>
                    
                    <button 
                      className="now-card__directions-btn" 
                      onClick={() => setSelectedVenueEvent({
                        venue: getVenueByName(event.venue),
                        directions: event.venueDirections
                      })}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
                        <line x1="9" y1="3" x2="9" y2="18"></line>
                        <line x1="15" y1="6" x2="15" y2="21"></line>
                      </svg>
                      Get instructions to reach venue
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <span className="empty-state__icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                  </span>
                  <p className="empty-state__text">Nothing happening right now</p>
                  <p className="empty-state__sub">Check the schedule for upcoming events</p>
                </div>
              )}
            </section>

            {/* ===== UP NEXT ===== */}
            <section className="dashboard-section">
              <h2 className="section-title">
                <svg className="section-title__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <polyline points="13 17 18 12 13 7" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="6 17 11 12 6 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Up Next
              </h2>

              {upNext.length > 0 ? (
                <div className="next-list">
                  {upNext.map(event => (
                    <div key={event.id} className="next-card">
                      <div className="next-card__time">
                        {formatTime(event.startTime)}
                      </div>
                      <div className="next-card__info">
                        <h4 className="next-card__name">{event.name}</h4>
                        <div className="next-card__venue">
                          <svg className="next-card__venue-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          {event.venue}
                        </div>
                      </div>
                      <div className="next-card__countdown">
                        Starts in {getCountdown(event.startTime)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state empty-state--small">
                  <p className="empty-state__text">No upcoming events today</p>
                </div>
              )}
            </section>

            {/* Quick link to full schedule */}
            <button className="dashboard-schedule-btn" onClick={() => navigate('/schedule')}>
              View Full Schedule →
            </button>
          </>
        )}
      </div>

      {selectedVenueEvent && (
        <VenueDirections 
          venue={selectedVenueEvent.venue} 
          directions={selectedVenueEvent.directions}
          onClose={() => setSelectedVenueEvent(null)} 
        />
      )}
    </div>
  )
}
