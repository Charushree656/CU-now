// src/pages/admin/CreateEvent.jsx
// Admin form to create a new orientation event

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../hooks/useAuth'
import { VENUE_LIST, getDefaultDirections } from '../../data/venues'
import Navbar from '../../components/Navbar'
import CustomDayPicker from '../../components/CustomDayPicker'
import CustomDatePicker from '../../components/CustomDatePicker'
import CustomTimePicker from '../../components/CustomTimePicker'
import CustomSelect from '../../components/CustomSelect'
import './Admin.css'

export default function CreateEvent() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [form, setForm] = useState({
    dayNumber: '1',
    name: '',
    venue: '',
    venueDirections: '',
    date: '',
    startTime: '',
    endTime: '',
    description: '',
    status: 'active',
    targetGroup: 'all',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Event name is required'
    if (!form.venue) e.venue = 'Venue is required'
    if (!form.date) e.date = 'Date is required'
    if (!form.startTime) e.startTime = 'Start time required'
    if (!form.endTime) e.endTime = 'End time required'
    return e
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  function handleVenueChange(venueName) {
    setForm(prev => ({
      ...prev,
      venue: venueName,
      venueDirections: getDefaultDirections(venueName),
    }))
    setErrors(prev => ({ ...prev, venue: '' }))
  }

  function handleCopyDefault() {
    const defaultDir = getDefaultDirections(form.venue)
    if (defaultDir) {
      setForm(prev => ({ ...prev, venueDirections: defaultDir }))
    }
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
      const startTime = Timestamp.fromDate(new Date(`${form.date}T${form.startTime}`))
      const endTime = Timestamp.fromDate(new Date(`${form.date}T${form.endTime}`))

      await addDoc(collection(db, 'events'), {
        dayNumber: parseInt(form.dayNumber),
        name: form.name.trim(),
        venue: form.venue.trim(),
        venueDirections: form.venueDirections.trim(),
        date: form.date,
        startTime,
        endTime,
        description: form.description.trim(),
        status: form.status,
        targetGroup: form.targetGroup === 'all' ? 'all' : parseInt(form.targetGroup),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      navigate('/admin')
    } catch (err) {
      console.error(err)
      setErrors({ submit: 'Failed to create event' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header__inner">
          <h1 className="admin-header__title">Create Event</h1>
          <button className="admin-back-btn" onClick={() => navigate(-1)}>← Back</button>
        </div>
      </div>

      <div className="admin-content">
        <form onSubmit={handleSubmit} className="admin-form">
          {/* Day Number */}
          <div className="form-group">
            <label className="form-label">Day Number *</label>
            <CustomDayPicker 
              name="dayNumber" 
              value={form.dayNumber} 
              onChange={handleChange} 
            />
          </div>

          {/* Event Name */}
          <div className="form-group">
            <label className="form-label">Event Name *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Campus Tour" className={`form-input ${errors.name ? 'form-input--error' : ''}`} />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          {/* Venue — Custom Dropdown */}
          <div className="form-group">
            <label className="form-label">Venue *</label>
            <CustomSelect
              value={form.venue}
              options={VENUE_LIST.map(v => ({ label: v, value: v }))}
              onChange={handleVenueChange}
              error={errors.venue}
              placeholder="Select a venue"
            />
            {errors.venue && <p className="form-error">{errors.venue}</p>}
          </div>

          {/* Venue Directions */}
          {form.venue && (
            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label">Venue Directions</label>
                <button
                  type="button"
                  className="form-copy-btn"
                  onClick={handleCopyDefault}
                  title="Reset to default directions"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                  Reset default
                </button>
              </div>
              <textarea
                name="venueDirections"
                value={form.venueDirections}
                onChange={handleChange}
                placeholder="Directions to reach this venue..."
                className="form-textarea"
                rows={3}
              />
              <p className="form-hint">These directions will be shown to students. Edit as needed or use the default.</p>
            </div>
          )}

          {/* Date */}
          <div className="form-group">
            <label className="form-label">Date *</label>
            <CustomDatePicker 
              name="date" 
              value={form.date} 
              onChange={handleChange} 
              error={errors.date} 
            />
            {errors.date && <p className="form-error">{errors.date}</p>}
          </div>

          {/* Times */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Time *</label>
              <CustomTimePicker 
                name="startTime" 
                value={form.startTime} 
                onChange={handleChange} 
                error={errors.startTime} 
              />
              {errors.startTime && <p className="form-error">{errors.startTime}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">End Time *</label>
              <CustomTimePicker 
                name="endTime" 
                value={form.endTime} 
                onChange={handleChange} 
                error={errors.endTime} 
                alignRight={true}
              />
              {errors.endTime && <p className="form-error">{errors.endTime}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Event description..." className="form-textarea" rows={4} />
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label">Status</label>
            <CustomSelect
              value={form.status}
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Cancelled', value: 'cancelled' },
                { label: 'Postponed', value: 'postponed' }
              ]}
              onChange={(val) => handleChange({ target: { name: 'status', value: val } })}
            />
          </div>

          {errors.submit && <p className="form-error">{errors.submit}</p>}

          <button type="submit" disabled={loading} className="admin-submit-btn">
            {loading ? (
              <><div className="spinner spinner--small" /> Creating...</>
            ) : (
              'Create Event'
            )}
          </button>
        </form>
      </div>

      <div style={{ flexShrink: 0 }}>
        <Navbar />
      </div>
    </div>
  )
}
