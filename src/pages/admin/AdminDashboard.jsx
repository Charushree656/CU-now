// src/pages/admin/AdminDashboard.jsx
// Admin dashboard — list events, quick stats, manage

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { formatTime, timeAgo } from '../../utils/formatters'
import Navbar from '../../components/Navbar'
import ConfirmModal from '../../components/ConfirmModal'
import './Admin.css'

const DAY_LABELS = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6']

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [pendingAdmins, setPendingAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    const q1 = query(collection(db, 'events'), orderBy('dayNumber', 'asc'), orderBy('startTime', 'asc'))
    const unsub1 = onSnapshot(q1, snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    const q2 = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'))
    const unsub2 = onSnapshot(q2, snap => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    // Listen for pending admin requests
    const q3 = query(collection(db, 'users'), where('adminStatus', '==', 'pending'))
    const unsub3 = onSnapshot(q3, snap => {
      setPendingAdmins(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => { unsub1(); unsub2(); unsub3() }
  }, [])

  async function handleDelete() {
    if (!deleteTarget) return
    const targetId = deleteTarget.id
    const isAnnouncement = deleteTarget.type === 'announcement'
    
    // Optimistic remove
    if (isAnnouncement) {
      setAnnouncements(prev => prev.filter(a => a.id !== targetId))
    } else {
      setEvents(prev => prev.filter(e => e.id !== targetId))
    }
    setDeleteTarget(null)
    
    try {
      await deleteDoc(doc(db, isAnnouncement ? 'announcements' : 'events', targetId))
    } catch (err) {
      console.error(err)
    }
  }

  async function handleApproveAdmin(userId) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: 'admin',
        adminStatus: 'approved',
        onboarded: true,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Failed to approve admin:', err)
    }
  }

  async function handleRejectAdmin(userId) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        adminStatus: 'rejected',
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Failed to reject admin:', err)
    }
  }

  const totalEvents = events.length
  const activeEvents = events.filter(e => e.status === 'active').length

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header__inner">
          <div>
            <h1 className="admin-header__title">Admin Panel</h1>
            <p className="admin-header__sub">{totalEvents} events · {announcements.length} announcements</p>
          </div>
          <button className="admin-back-btn" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* Quick Actions */}
        <div className="admin-actions">
          <button className="admin-action-btn admin-action-btn--primary" onClick={() => navigate('/admin/create-event')}>
            <span className="admin-action-btn__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </span>
            Add Event
          </button>
          <button className="admin-action-btn" onClick={() => navigate('/admin/create-announcement')}>
            <span className="admin-action-btn__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            </span>
            Announcement
          </button>
          <button className="admin-action-btn" onClick={() => navigate('/admin/manage-groups')}>
            <span className="admin-action-btn__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            </span>
            Groups
          </button>
          <button className="admin-action-btn" onClick={() => navigate('/admin/feedbacks')}>
            <span className="admin-action-btn__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            </span>
            Feedbacks
          </button>
        </div>

        {/* ===== PENDING ADMIN REQUESTS ===== */}
        {pendingAdmins.length > 0 && (
          <div className="admin-approval-section">
            <div className="admin-approval-header">
              <span className="admin-approval-badge">{pendingAdmins.length}</span>
              <h3 className="admin-approval-title">Pending Admin Requests</h3>
            </div>
            <div className="admin-approval-list">
              {pendingAdmins.map(req => (
                <div key={req.id} className="admin-approval-card">
                  <div className="admin-approval-card__info">
                    <div className="admin-approval-card__avatar">
                      {req.photoURL ? (
                        <img src={req.photoURL} alt="" className="admin-approval-card__photo" />
                      ) : (
                        <span className="admin-approval-card__initial">{(req.name || req.email || '?').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="admin-approval-card__details">
                      <p className="admin-approval-card__name">{req.name || 'Unknown'}</p>
                      <p className="admin-approval-card__email">{req.email}</p>
                      {req.designation && (
                        <p className="admin-approval-card__meta">
                          <strong>Role:</strong> {req.designation}
                          {req.organization && ` · ${req.organization}`}
                        </p>
                      )}
                      {req.adminRequestReason && (
                        <p className="admin-approval-card__reason">
                          "{req.adminRequestReason}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="admin-approval-card__actions">
                    <button
                      className="admin-approval-btn admin-approval-btn--approve"
                      onClick={() => handleApproveAdmin(req.id)}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="admin-approval-btn admin-approval-btn--reject"
                      onClick={() => handleRejectAdmin(req.id)}
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="admin-stats">
          <div className="admin-stat">
            <span className="admin-stat__number">{totalEvents}</span>
            <span className="admin-stat__label">Total Events</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat__number">{activeEvents}</span>
            <span className="admin-stat__label">Active</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat__number">{announcements.length}</span>
            <span className="admin-stat__label">Updates</span>
          </div>
        </div>

        {/* Announcements */}
        {announcements.length > 0 && (
          <div className="admin-day-group">
            <h3 className="admin-day-title">Announcements</h3>
            <div className="admin-event-list">
              {announcements.map(ann => (
                <div key={ann.id} className="admin-event-card">
                  <div className="admin-event-info">
                    <span className={`admin-event-status admin-event-status--active`}>
                      {ann.urgency || 'normal'}
                    </span>
                    <h4 className="admin-event-name">{ann.title}</h4>
                    <p className="admin-event-meta">
                      {timeAgo(ann.createdAt)} · {ann.message?.substring(0, 50)}{ann.message?.length > 50 ? '...' : ''}
                    </p>
                  </div>
                  <div className="admin-event-actions">
                    <button className="admin-icon-btn admin-icon-btn--danger" onClick={() => setDeleteTarget({ ...ann, type: 'announcement' })}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events by Day */}
        {loading ? (
          <div className="admin-skeleton">
            {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
          </div>
        ) : (
          DAY_LABELS.map((label, i) => {
            const day = i + 1
            const dayEvents = events.filter(e => e.dayNumber === day)
            if (dayEvents.length === 0) return null
            return (
              <div key={day} className="admin-day-group">
                <h3 className="admin-day-title">{label}</h3>
                <div className="admin-event-list">
                  {dayEvents.map(event => (
                    <div key={event.id} className="admin-event-card">
                      <div className="admin-event-info">
                        <span className={`admin-event-status admin-event-status--${event.status}`}>
                          {event.status}
                        </span>
                        <h4 className="admin-event-name">{event.name}</h4>
                        <p className="admin-event-meta">
                          {formatTime(event.startTime)} – {formatTime(event.endTime)} · {event.venue}
                        </p>
                      </div>
                      <div className="admin-event-actions">
                        <button className="admin-icon-btn" onClick={() => navigate(`/admin/edit-event/${event.id}`)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="admin-icon-btn admin-icon-btn--danger" onClick={() => setDeleteTarget({ ...event, type: 'event' })}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title={`Delete ${deleteTarget?.type === 'announcement' ? 'Announcement' : 'Event'}`}
        message={`Are you sure you want to delete "${deleteTarget?.type === 'announcement' ? deleteTarget?.title : deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div style={{ flexShrink: 0 }}>
        <Navbar />
      </div>
    </div>
  )
}
