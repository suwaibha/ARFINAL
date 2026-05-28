import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const AUTH_KEY = 'ar_layout_auth'
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error || response.statusText || 'Request failed')
  }

  return response.json()
}

function Login({ onLogin }) {
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')

  const submit = () => {
    if (u === 'admin' && p === 'arLayout2024') {
      onLogin()
    } else {
      setErr('Wrong username or password. Please try again.')
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-logo">AR</div>
        <div className="login-title">AR Layout</div>
        <div className="login-sub">Plot Management System</div>
        {err && <div className="login-err">{err}</div>}
        <div className="login-field">
          <label>Username</label>
          <input
            value={u}
            onChange={e => setU(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Enter username"
            autoFocus
          />
        </div>
        <div className="login-field">
          <label>Password</label>
          <input
            type="password"
            value={p}
            onChange={e => setP(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Enter password"
          />
        </div>
        <button className="login-btn" onClick={submit}>Login →</button>
        <div className="login-sub" style={{ marginTop: 14 }}>
          Default: admin / arLayout2024
        </div>
      </div>
    </div>
  )
}

function PlotModal({ plot, onClose, onEdit }) {
  if (!plot) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          <span style={{ fontFamily: 'DM Mono', fontSize: 16 }}>Plot {plot.number}</span>
          <span className={`status-pill ${plot.sold ? 'sold' : 'avail'}`}>
            {plot.sold ? 'SOLD' : 'AVAILABLE'}
          </span>
        </div>
        <div className="modal-sub">
          AR Layout • {plot.sold ? 'Sold property' : 'Available for purchase'}
        </div>
        {plot.sold ? (
          <>
            <div className="modal-row">
              <span className="modal-key">Buyer</span>
              <span className="modal-val">{plot.buyerName || '—'}</span>
            </div>
            <div className="modal-row">
              <span className="modal-key">Phone</span>
              <span className="modal-val">{plot.phone || '—'}</span>
            </div>
            <div className="modal-row">
              <span className="modal-key">Sale Amount</span>
              <span className="modal-val" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                {plot.saleAmount || '—'}
              </span>
            </div>
            <div className="modal-row">
              <span className="modal-key">Sale Date</span>
              <span className="modal-val">{plot.saleDate || '—'}</span>
            </div>
            {plot.notes && (
              <div className="modal-row">
                <span className="modal-key">Notes</span>
                <span className="modal-val">{plot.notes}</span>
              </div>
            )}
          </>
        ) : (
          <div className="modal-sub" style={{ margin: '0 0 16px', background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 8, padding: '12px 14px', color: 'var(--green)' }}>
            ✓ This plot is available for sale.
          </div>
        )}
        <div className="btn-row" style={{ marginTop: 16 }}>
          <button className="btn primary" onClick={() => { onEdit(plot); onClose() }}>
            Edit / Update
          </button>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function UploadZone({ onUpload }) {
  const inputRef = useRef(null)

  const handleFile = file => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => onUpload(e.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div
      className="upload-zone"
      style={{ width: '100%' }}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)' }}
      onDragLeave={e => { e.currentTarget.style.borderColor = '' }}
      onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
    >
      <input ref={inputRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} />
      <div className="upload-zone-icon">🗺</div>
      <div className="upload-zone-title">Upload Your Layout Map</div>
      <div className="upload-zone-sub">
        Click to browse or drag & drop your AR Layout image here<br />
        (JPG, PNG, or any image format)
      </div>
    </div>
  )
}

function PlotPin({ plot, selected, onClick }) {
  return (
    <div
      className="plot-pin"
      style={{ left: `${plot.x}%`, top: `${plot.y}%` }}
      onClick={onClick}
      title={plot.sold ? `${plot.number} — SOLD to ${plot.buyerName || 'Buyer'}` : `${plot.number} — Available`}
    >
      <div className="plot-pin-inner">
        <div className={`plot-bubble ${plot.sold ? 'sold' : 'avail'}`} style={selected ? { outline: '2px solid var(--accent)', outlineOffset: 2 } : {}}>
          {plot.number}
        </div>
        {plot.sold && <div className="plot-stamp">SOLD</div>}
      </div>
    </div>
  )
}

function MapView({ plots, mapImage, onMapUpload, onAddPlot, onClickPlot, selectedId, addMode, setAddMode, onDownload }) {
  const imgRef = useRef(null)

  const handleMapClick = useCallback((e) => {
    if (!addMode || !imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(2)
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(2)
    onAddPlot(parseFloat(x), parseFloat(y))
  }, [addMode, onAddPlot])

  return (
    <div className="map-card">
      <div className="map-card-header">
        <span className="map-card-title">AR Layout — Interactive Plot Map</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="map-legend">
            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--green)' }} />Available</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--red)' }} />Sold</div>
          </div>
          {mapImage && (
            <>
              <button className={`btn sm ${addMode ? 'accent' : ''}`} onClick={() => setAddMode(v => !v)}>
                {addMode ? '✕ Cancel' : '+ Add Plot'}
              </button>
              <button className="btn sm success" onClick={onDownload} title="Download map as PNG with all plot pins">
                ⬇ Download Map
              </button>
            </>
          )}
        </div>
      </div>

      {addMode && (
        <div className="add-mode-bar">
          📍 Click anywhere on the map to place a new plot marker
        </div>
      )}

      <div className="map-wrap">
        {!mapImage ? (
          <UploadZone onUpload={onMapUpload} />
        ) : (
          <div className={`map-relative ${addMode ? 'add-mode' : ''}`} onClick={handleMapClick}>
            <img ref={imgRef} src={mapImage} alt="AR Layout Map" draggable={false} />
            {plots.map(plot => (
              <PlotPin
                key={plot._id || plot.id}
                plot={plot}
                selected={selectedId === (plot._id || plot.id)}
                onClick={e => { e.stopPropagation(); if (!addMode) onClickPlot(plot) }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TableView({ plots, onEdit }) {
  const [search, setSearch] = useState('')
  const filtered = plots.filter(p =>
    p.number.toLowerCase().includes(search.toLowerCase()) ||
    (p.buyerName || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="toolbar">
        <input
          style={{ padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--surface)', outline: 'none', width: 220, fontFamily: 'DM Sans, sans-serif' }}
          placeholder="Search plot or buyer…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{filtered.length} plots</span>
      </div>
      <div className="table-card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Plot No.</th>
              <th>Status</th>
              <th>Buyer Name</th>
              <th>Phone</th>
              <th>Sale Amount</th>
              <th>Sale Date</th>
              <th>Notes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--text3)' }}>No plots found</td></tr>
            )}
            {filtered.map(plot => (
              <tr key={plot._id || plot.id} className={plot.sold ? 'sold-row' : ''}>
                <td><span style={{ fontFamily: 'DM Mono', fontWeight: 500, fontSize: 12 }}>{plot.number}</span></td>
                <td><span className={`status-pill ${plot.sold ? 'sold' : 'avail'}`}>{plot.sold ? 'Sold' : 'Available'}</span></td>
                <td style={{ fontWeight: plot.sold ? 500 : 400, color: plot.sold ? 'var(--text)' : 'var(--text3)' }}>{plot.buyerName || '—'}</td>
                <td style={{ color: 'var(--text2)' }}>{plot.phone || '—'}</td>
                <td style={{ color: 'var(--accent)', fontWeight: plot.sold ? 600 : 400 }}>{plot.saleAmount || '—'}</td>
                <td style={{ color: 'var(--text2)' }}>{plot.saleDate || '—'}</td>
                <td style={{ color: 'var(--text3)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plot.notes || '—'}</td>
                <td>
                  <button className="btn sm" onClick={() => onEdit(plot)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Sidebar({ plots, selectedId, onSelect, onSave, onDelete }) {
  const [form, setForm] = useState(null)

  useEffect(() => {
    const selected = plots.find(p => p._id === selectedId || p.id === selectedId)
    setForm(selected ? { ...selected } : null)
  }, [selectedId, plots])

  const setField = (key, value) => setForm(current => current ? ({ ...current, [key]: value }) : null)

  const soldCount = plots.filter(p => p.sold).length
  const availCount = plots.length - soldCount

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Plots <span className="plot-count">{plots.length}</span></span>
        <span style={{ fontSize: 10 }}>
          <span style={{ color: 'var(--green)', fontWeight: 600 }}>{availCount} free</span>
          {' · '}
          <span style={{ color: 'var(--red)', fontWeight: 600 }}>{soldCount} sold</span>
        </span>
      </div>

      <div className="sidebar-body">
        {plots.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text3)', fontSize: 12 }}>
            Upload map & click "+ Add Plot" to place plots on the map
          </div>
        )}
        {plots.map(plot => (
          <div
            key={plot._id || plot.id}
            className={`plot-item ${selectedId === (plot._id || plot.id) ? 'selected' : ''} ${plot.sold ? 'is-sold' : ''}`}
            onClick={() => onSelect(plot._id || plot.id)}
          >
            <div className="plot-item-top">
              <span className="plot-num">{plot.number}</span>
              <span className={`plot-tag ${plot.sold ? 'sold' : 'avail'}`}>{plot.sold ? 'Sold' : 'Available'}</span>
            </div>
            {plot.sold && plot.buyerName && <div className="plot-buyer">{plot.buyerName}</div>}
            {plot.sold && plot.saleAmount && <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginTop: 1 }}>{plot.saleAmount}</div>}
          </div>
        ))}
      </div>

      {form && (
        <div className="detail-panel">
          <h3>
            <span style={{ fontFamily: 'DM Mono' }}>Plot {form.number}</span>
            <span className={`plot-tag ${form.sold ? 'sold' : 'avail'}`} style={{ fontSize: 10 }}>{form.sold ? 'Sold' : 'Available'}</span>
          </h3>

          <div className="field-group">
            <div className="field">
              <label>Plot Number</label>
              <input value={form.number || ''} onChange={e => setField('number', e.target.value)} placeholder="e.g. A-01" />
            </div>

            <div className="sold-toggle" onClick={() => setField('sold', !form.sold)} style={{ cursor: 'pointer' }}>
              <div className={`toggle-track ${form.sold ? 'on' : ''}`}><div className="toggle-knob" /></div>
              <span className="toggle-label">{form.sold ? '🔴 Mark as SOLD' : '🟢 Mark as AVAILABLE'}</span>
            </div>

            {form.sold && (
              <>
                <div className="field">
                  <label>Buyer Name</label>
                  <input value={form.buyerName || ''} onChange={e => setField('buyerName', e.target.value)} placeholder="Full name" />
                </div>
                <div className="field">
                  <label>Phone Number</label>
                  <input value={form.phone || ''} onChange={e => setField('phone', e.target.value)} placeholder="10-digit number" />
                </div>
                <div className="field">
                  <label>Sale Amount (₹)</label>
                  <input value={form.saleAmount || ''} onChange={e => setField('saleAmount', e.target.value)} placeholder="e.g. ₹12,50,000" />
                </div>
                <div className="field">
                  <label>Sale Date</label>
                  <input type="date" value={form.saleDate || ''} onChange={e => setField('saleDate', e.target.value)} />
                </div>
                <div className="field">
                  <label>Notes</label>
                  <textarea value={form.notes || ''} onChange={e => setField('notes', e.target.value)} placeholder="Any notes…" />
                </div>
              </>
            )}
          </div>

          <div className="btn-row">
            <button className="btn primary" onClick={() => onSave(form)}>Save</button>
            <button className="btn danger sm" onClick={() => onDelete(form._id || form.id)}>Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}

function AddPlotModal({ x, y, onConfirm, onCancel }) {
  const [num, setNum] = useState('')

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title" style={{ fontSize: 16 }}>Place New Plot</div>
        <div className="modal-sub">Position: {x}%, {y}% on map</div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--text3)', fontWeight: 600, marginBottom: 4, display: 'block' }}>Plot Number</label>
          <input
            style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 14, fontFamily: 'DM Mono, monospace', background: 'var(--surface2)', outline: 'none', color: 'var(--text)' }}
            value={num}
            onChange={e => setNum(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && num.trim() && onConfirm(num.trim())}
            placeholder="e.g.  A-01  or  Plot 5"
            autoFocus
          />
        </div>
        <div className="btn-row">
          <button className="btn primary" disabled={!num.trim()} onClick={() => num.trim() && onConfirm(num.trim())}>Add Plot</button>
          <button className="btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem(AUTH_KEY))
  const [plots, setPlots] = useState([])
  const [mapImage, setMapImage] = useState(null)
  const [tab, setTab] = useState('map')
  const [selectedId, setSelectedId] = useState(null)
  const [modalPlot, setModalPlot] = useState(null)
  const [addMode, setAddMode] = useState(false)
  const [pending, setPending] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadState = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const state = await apiFetch('/state')
      setMapImage(state.mapImage || null)
      setPlots(state.plots || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authed) {
      loadState()
    }
  }, [authed, loadState])

  const persistMap = useCallback(async (image) => {
    setLoading(true)
    setError('')

    try {
      await apiFetch('/map', { method: 'POST', body: JSON.stringify({ mapImage: image }) })
      setMapImage(image)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const addPlot = useCallback(async (plot) => {
    setLoading(true)
    setError('')

    try {
      const created = await apiFetch('/plots', { method: 'POST', body: JSON.stringify(plot) })
      setPlots(prev => [...prev, created])
      setSelectedId(created._id || created.id)
      return created
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePlot = useCallback(async (plot) => {
    setLoading(true)
    setError('')

    try {
      const updated = await apiFetch(`/plots/${plot._id || plot.id}`, { method: 'PUT', body: JSON.stringify(plot) })
      setPlots(prev => prev.map(item => (item._id === updated._id || item.id === updated.id ? updated : item)))
      setSelectedId(updated._id || updated.id)
      return updated
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deletePlot = useCallback(async (id) => {
    setLoading(true)
    setError('')

    try {
      await apiFetch(`/plots/${id}`, { method: 'DELETE' })
      setPlots(prev => prev.filter(item => item._id !== id && item.id !== id))
      setSelectedId(null)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const handleMapClick = useCallback((x, y) => {
    setPending({ x, y })
    setAddMode(false)
  }, [])

  const handleConfirmAdd = useCallback(async (number) => {
    const plot = {
      number,
      x: pending.x,
      y: pending.y,
      sold: false,
      buyerName: '',
      phone: '',
      saleAmount: '',
      saleDate: '',
      notes: ''
    }

    try {
      await addPlot(plot)
      setPending(null)
    } catch {
      // error state already handled
    }
  }, [addPlot, pending])

  const handleSelect = useCallback((id) => {
    setSelectedId(id)
  }, [])

  const handleClickPin = useCallback((plot) => {
    setSelectedId(plot._id || plot.id)
    setModalPlot(plot)
  }, [])

  const handleEdit = useCallback((plot) => {
    setSelectedId(plot._id || plot.id)
    setTab('map')
    setModalPlot(null)
  }, [])

  const saveForm = useCallback(async (form) => {
    try {
      await updatePlot(form)
    } catch {
      // handled above
    }
  }, [updatePlot])

  const removeForm = useCallback(async (id) => {
    try {
      await deletePlot(id)
    } catch {
      // handled above
    }
  }, [deletePlot])

  const handleMapUpload = useCallback(async (image) => {
    await persistMap(image)
  }, [persistMap])

  const handleDownload = useCallback(() => {
    // Extract basic download functionality from DOM canvas
    if (!mapImage || plots.length === 0) {
      alert('Please upload a map and add at least one plot first.')
      return
    }

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(2, 3000 / Math.max(img.width, img.height))
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      plots.forEach(plot => {
        const px = (plot.x / 100) * canvas.width
        const py = (plot.y / 100) * canvas.height
        const isSold = plot.sold
        const bgColor = isSold ? '#fde8e8' : '#d8f3dc'
        const borderColor = isSold ? '#9b2226' : '#2d6a4f'
        const textColor = isSold ? '#9b2226' : '#2d6a4f'
        const label = plot.number
        const fontSize = Math.max(11, Math.round(canvas.width / 80))

        ctx.font = `600 ${fontSize}px "DM Mono", monospace`
        const textW = ctx.measureText(label).width
        const padX = fontSize * 0.7
        const padY = fontSize * 0.45
        const boxW = textW + padX * 2
        const boxH = fontSize + padY * 2
        const rx = boxH / 3

        ctx.save()
        ctx.shadowColor = 'rgba(0,0,0,0.25)'
        ctx.shadowBlur = 8
        ctx.shadowOffsetY = 2
        ctx.beginPath()
        ctx.moveTo(px - boxW / 2 + rx, py - boxH / 2)
        ctx.lineTo(px + boxW / 2 - rx, py - boxH / 2)
        ctx.arcTo(px + boxW / 2, py - boxH / 2, px + boxW / 2, py - boxH / 2 + rx, rx)
        ctx.lineTo(px + boxW / 2, py + boxH / 2 - rx)
        ctx.arcTo(px + boxW / 2, py + boxH / 2, px + boxW / 2 - rx, py + boxH / 2, rx)
        ctx.lineTo(px - boxW / 2 + rx, py + boxH / 2)
        ctx.arcTo(px - boxW / 2, py + boxH / 2, px - boxW / 2, py + boxH / 2 - rx, rx)
        ctx.lineTo(px - boxW / 2, py - boxH / 2 + rx)
        ctx.arcTo(px - boxW / 2, py - boxH / 2, px - boxW / 2 + rx, py - boxH / 2, rx)
        ctx.closePath()
        ctx.fillStyle = bgColor
        ctx.fill()
        ctx.restore()

        ctx.beginPath()
        ctx.moveTo(px - boxW / 2 + rx, py - boxH / 2)
        ctx.lineTo(px + boxW / 2 - rx, py - boxH / 2)
        ctx.arcTo(px + boxW / 2, py - boxH / 2, px + boxW / 2, py - boxH / 2 + rx, rx)
        ctx.lineTo(px + boxW / 2, py + boxH / 2 - rx)
        ctx.arcTo(px + boxW / 2, py + boxH / 2, px + boxW / 2 - rx, py + boxH / 2, rx)
        ctx.lineTo(px - boxW / 2 + rx, py + boxH / 2)
        ctx.arcTo(px - boxW / 2, py + boxH / 2, px - boxW / 2, py + boxH / 2 - rx, rx)
        ctx.lineTo(px - boxW / 2, py - boxH / 2 + rx)
        ctx.arcTo(px - boxW / 2, py - boxH / 2, px - boxW / 2 + rx, py - boxH / 2, rx)
        ctx.closePath()
        ctx.strokeStyle = borderColor
        ctx.lineWidth = Math.max(1.5, fontSize * 0.12)
        ctx.stroke()

        ctx.fillStyle = textColor
        ctx.font = `600 ${fontSize}px "DM Mono", monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, px, py)

        if (isSold) {
          const stampFontSize = Math.max(8, Math.round(fontSize * 0.7))
          const stampText = 'SOLD'
          const stampW = ctx.measureText(stampText).width + stampFontSize
          const stampH = stampFontSize + 4
          const stampY = py + boxH / 2 + 4
          const srx = 3

          ctx.fillStyle = '#9b2226'
          ctx.beginPath()
          ctx.moveTo(px - stampW / 2 + srx, stampY)
          ctx.lineTo(px + stampW / 2 - srx, stampY)
          ctx.arcTo(px + stampW / 2, stampY, px + stampW / 2, stampY + srx, srx)
          ctx.lineTo(px + stampW / 2, stampY + stampH - srx)
          ctx.arcTo(px + stampW / 2, stampY + stampH, px + stampW / 2 - srx, stampY + stampH, srx)
          ctx.lineTo(px - stampW / 2 + srx, stampY + stampH)
          ctx.arcTo(px - stampW / 2, stampY + stampH, px - stampW / 2, stampY + stampH - srx, srx)
          ctx.lineTo(px - stampW / 2, stampY + srx)
          ctx.arcTo(px - stampW / 2, stampY, px - stampW / 2 + srx, stampY, srx)
          ctx.closePath()
          ctx.fill()

          ctx.fillStyle = '#ffffff'
          ctx.font = `700 ${stampFontSize}px "DM Sans", sans-serif`
          ctx.fillText(stampText, px, stampY + stampH / 2)
        }
      })

      const wFontSize = Math.max(12, Math.round(canvas.width / 100))
      ctx.save()
      ctx.globalAlpha = 0.35
      ctx.fillStyle = '#1a1916'
      ctx.font = `500 ${wFontSize}px "DM Sans", sans-serif`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      ctx.fillText('AR Layout — Plot Management', canvas.width - 12, canvas.height - 10)
      ctx.restore()

      const a = document.createElement('a')
      a.download = `AR_Layout_Map_${new Date().toISOString().slice(0, 10)}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }

    img.src = mapImage
  }, [mapImage, plots])

  const selectedPlot = useMemo(() => plots.find(plot => plot._id === selectedId || plot.id === selectedId), [plots, selectedId])
  const sold = useMemo(() => plots.filter(p => p.sold).length, [plots])
  const avail = plots.length - sold

  if (!authed) {
    return <Login onLogin={() => { localStorage.setItem(AUTH_KEY, '1'); setAuthed(true) }} />
  }

  return (
    <div className="shell">
      <div className="topbar">
        <div className="logo">
          <div className="logo-mark">AR</div>
          <div>
            <div className="logo-text">AR Layout</div>
            <div className="logo-sub">Plot Management</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {mapImage && (
            <>
              <button
                className="btn sm"
                onClick={() => document.getElementById('map-replace-input')?.click()}
              >
                🖼 Replace Map
              </button>
              <input
                id="map-replace-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = ev => persistMap(ev.target.result)
                  reader.readAsDataURL(file)
                  e.target.value = ''
                }}
              />
            </>
          )}
          <button
            className="btn sm danger"
            onClick={() => {
              if (window.confirm('Logout?')) {
                localStorage.removeItem(AUTH_KEY)
                setAuthed(false)
              }
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="main">
        <Sidebar
          plots={plots}
          selectedId={selectedId}
          onSelect={handleSelect}
          onSave={saveForm}
          onDelete={removeForm}
        />

        <div className="canvas-area">
          <div className="stats-row">
            <div className="stat">
              <div className="stat-label">Total Plots</div>
              <div className="stat-value">{plots.length}</div>
            </div>
            <div className="stat s-sold">
              <div className="stat-label">Sold</div>
              <div className="stat-value">{sold}</div>
            </div>
            <div className="stat s-avail">
              <div className="stat-label">Available</div>
              <div className="stat-value">{avail}</div>
            </div>
          </div>

          <div className="table-card" style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="tab-bar">
              <button className={`tab-btn ${tab === 'map' ? 'active' : ''}`} onClick={() => setTab('map')}>🗺 Layout Map</button>
              <button className={`tab-btn ${tab === 'table' ? 'active' : ''}`} onClick={() => setTab('table')}>📋 Plot Records</button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: tab === 'table' ? 16 : 0 }}>
              {loading && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)' }}>
                  Loading data…
                </div>
              )}
              {!loading && error && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--red)', fontWeight: 600 }}>
                  {error}
                </div>
              )}
              {!loading && !error && tab === 'map' && (
                <MapView
                  plots={plots}
                  mapImage={mapImage}
                  onMapUpload={handleMapUpload}
                  onAddPlot={handleMapClick}
                  onClickPlot={handleClickPin}
                  selectedId={selectedId}
                  addMode={addMode}
                  setAddMode={setAddMode}
                  onDownload={handleDownload}
                />
              )}
              {!loading && !error && tab === 'table' && (
                <TableView plots={plots} onEdit={handleEdit} />
              )}
            </div>
          </div>
        </div>
      </div>

      {modalPlot && (
        <PlotModal
          plot={plots.find(p => p._id === modalPlot._id || p.id === modalPlot.id) || modalPlot}
          onClose={() => setModalPlot(null)}
          onEdit={handleEdit}
        />
      )}
      {pending && (
        <AddPlotModal
          x={pending.x}
          y={pending.y}
          onConfirm={handleConfirmAdd}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  )
}

export default App
