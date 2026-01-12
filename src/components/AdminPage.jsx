import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './AdminPage.css'
import ebcToHex from '../utils/ebcToColor'

function AdminPage() {
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingTap, setEditingTap] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTypeIndex, setEditingTypeIndex] = useState(null)
  const [editingGlassTypeIndex, setEditingGlassTypeIndex] = useState(null)
  const [showAddType, setShowAddType] = useState(false)
  const [showAddGlassType, setShowAddGlassType] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    taps: true,
    types: true,
    glassTypes: true,
  })

  useEffect(() => {
    fetchState()
  }, [])

  const fetchState = async () => {
    try {
      const response = await fetch('/api/state')
      const data = await response.json()
      setState(data)
      setLoading(false)
    } catch (error) {
      console.error('Feil ved henting av tilstand:', error)
      setLoading(false)
    }
  }

  const saveState = async (updatedState) => {
    try {
      const response = await fetch('/api/state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedState),
      })
      if (response.ok) {
        setState(updatedState)
        setEditingTap(null)
        setShowAddForm(false)
        setEditingTypeIndex(null)
        setEditingGlassTypeIndex(null)
        setShowAddType(false)
        setShowAddGlassType(false)
      }
    } catch (error) {
      console.error('Feil ved lagring av tilstand:', error)
      alert('Kunne ikke lagre endringer')
    }
  }

  const handleEdit = (tapKey) => {
    setEditingTap(tapKey)
    setShowAddForm(false)
  }

  const handleSave = (tapKey, beerData) => {
    const updatedState = {
      ...state,
      onTap: {
        ...state.onTap,
        [tapKey]: beerData,
      },
    }
    saveState(updatedState)
  }

  const handleDelete = (tapKey) => {
    if (window.confirm('Er du sikker på at du vil fjerne denne ølen fra tapp?')) {
      const updatedState = {
        ...state,
        onTap: {
          ...state.onTap,
          [tapKey]: null,
        },
      }
      saveState(updatedState)
    }
  }

  const handleAdd = (tapKey, beerData) => {
    const updatedState = {
      ...state,
      onTap: {
        ...state.onTap,
        [tapKey]: beerData,
      },
    }
    saveState(updatedState)
  }

  const handleTypeUpdate = (index, newValue) => {
    const updatedTypes = [...state.types]
    updatedTypes[index] = newValue
    const updatedState = {
      ...state,
      types: updatedTypes,
    }
    saveState(updatedState)
  }

  const handleTypeAdd = (newType) => {
    const updatedState = {
      ...state,
      types: [...state.types, newType],
    }
    saveState(updatedState)
  }

  const handleTypeDelete = (index) => {
    if (window.confirm('Er du sikker på at du vil slette denne typen?')) {
      const updatedTypes = state.types.filter((_, i) => i !== index)
      const updatedState = {
        ...state,
        types: updatedTypes,
      }
      saveState(updatedState)
    }
  }

  const handleGlassTypeUpdate = (index, newGlassType) => {
    const updatedGlassTypes = [...state.glassTypes]
    updatedGlassTypes[index] = newGlassType
    const updatedState = {
      ...state,
      glassTypes: updatedGlassTypes,
    }
    saveState(updatedState)
  }

  const handleGlassTypeAdd = (newGlassType) => {
    const updatedState = {
      ...state,
      glassTypes: [...state.glassTypes, newGlassType],
    }
    saveState(updatedState)
  }

  const handleGlassTypeDelete = (index) => {
    if (window.confirm('Er du sikker på at du vil slette denne glassetypen?')) {
      const updatedGlassTypes = state.glassTypes.filter((_, i) => i !== index)
      const updatedState = {
        ...state,
        glassTypes: updatedGlassTypes,
      }
      saveState(updatedState)
    }
  }

  const getAvailableTaps = () => {
    if (!state) return []
    const taps = ['line1', 'line2', 'line3']
    return taps.map((tap) => ({
      key: tap,
      number: tap.replace('line', ''),
      beer: state.onTap[tap],
    }))
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading">Laster...</div>
      </div>
    )
  }

  if (!state) {
    return (
      <div className="admin-page">
        <div className="error">Kunne ikke laste data</div>
      </div>
    )
  }

  const taps = getAvailableTaps()

  return (
    <div className="admin-page">
      <header className="admin-header">
        <Link to="/" className="back-link">← Tilbake</Link>
        <h1>Admin</h1>
      </header>

      <main className="admin-content">
        <div className="admin-section collapsible">
          <div 
            className="section-header clickable-header"
            onClick={() => setExpandedSections({ ...expandedSections, taps: !expandedSections.taps })}
          >
            <div className="section-title-row">
              <span className="collapse-toggle">
                {expandedSections.taps ? '▼' : '▶'}
              </span>
              <h2>Øl på tapp</h2>
            </div>
            <button
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation()
                setShowAddForm(true)
                setEditingTap(null)
                setExpandedSections({ ...expandedSections, taps: true })
              }}
            >
              + Legg til øl
            </button>
          </div>

          {expandedSections.taps && (
            <div className="section-content">

          {showAddForm && (
            <BeerForm
              types={state.types}
              onSave={(beerData) => {
                // Finn første ledige tap eller bruk line1
                const emptyTap = taps.find((t) => !t.beer)?.key || 'line1'
                handleAdd(emptyTap, beerData)
              }}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          <div className="taps-list">
            {taps.map((tap) => (
              <div key={tap.key} className="tap-card">
                {tap.beer ? (
                  editingTap === tap.key ? (
                    <BeerForm
                      types={state.types}
                      initialData={tap.beer}
                      onSave={(beerData) => handleSave(tap.key, beerData)}
                      onCancel={() => setEditingTap(null)}
                    />
                  ) : (
                    <div className="tap-beer">
                      <div className="tap-header">
                        <h3>Tapp {tap.number}</h3>
                        <div className="tap-actions">
                          <button
                            className="btn btn-edit"
                            onClick={() => handleEdit(tap.key)}
                          >
                            Rediger
                          </button>
                          <button
                            className="btn btn-delete"
                            onClick={() => handleDelete(tap.key)}
                          >
                            Fjern
                          </button>
                        </div>
                      </div>
                      <div className="beer-info">
                        <div className="beer-color-preview" style={{ backgroundColor: tap.beer.color }} />
                        <div className="beer-details">
                          <h4>{tap.beer.name}</h4>
                          <p className="beer-type">{tap.beer.type}</p>
                          <div className="beer-specs">
                            <span>ABV: {tap.beer.abv}%</span>
                            <span>IBU: {tap.beer.ibu}</span>
                            <span>EBC: {tap.beer.ebc}</span>
                            <span>Gjenstående: {tap.beer.remainingLiters}L</span>
                          </div>
                          {tap.beer.description && (
                            <p className="beer-description">{tap.beer.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="tap-empty">
                    <p>Tapp {tap.number} er tom</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setEditingTap(tap.key)
                        setShowAddForm(false)
                      }}
                    >
                      Legg til øl
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
            </div>
          )}
        </div>

        <div className="admin-section collapsible">
          <div 
            className="section-header clickable-header"
            onClick={() => setExpandedSections({ ...expandedSections, types: !expandedSections.types })}
          >
            <div className="section-title-row">
              <span className="collapse-toggle">
                {expandedSections.types ? '▼' : '▶'}
              </span>
              <h2>Øltyper</h2>
            </div>
            <button
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation()
                setShowAddType(true)
                setEditingTypeIndex(null)
                setExpandedSections({ ...expandedSections, types: true })
              }}
            >
              + Legg til type
            </button>
          </div>

          {expandedSections.types && (
            <div className="section-content">

          {showAddType && (
            <TypeForm
              onSave={(type) => {
                handleTypeAdd(type)
                setShowAddType(false)
              }}
              onCancel={() => setShowAddType(false)}
            />
          )}

          <div className="list-items">
            {state.types.map((type, index) => (
              <div key={index} className="list-item">
                {editingTypeIndex === index ? (
                  <TypeForm
                    initialValue={type}
                    onSave={(newType) => {
                      handleTypeUpdate(index, newType)
                      setEditingTypeIndex(null)
                    }}
                    onCancel={() => setEditingTypeIndex(null)}
                  />
                ) : (
                  <>
                    <span className="list-item-text">{type}</span>
                    <div className="list-item-actions">
                      <button
                        className="btn btn-edit"
                        onClick={() => {
                          setEditingTypeIndex(index)
                          setShowAddType(false)
                        }}
                      >
                        Rediger
                      </button>
                      <button
                        className="btn btn-delete"
                        onClick={() => handleTypeDelete(index)}
                      >
                        Slett
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
            </div>
          )}
        </div>

        <div className="admin-section collapsible">
          <div 
            className="section-header clickable-header"
            onClick={() => setExpandedSections({ ...expandedSections, glassTypes: !expandedSections.glassTypes })}
          >
            <div className="section-title-row">
              <span className="collapse-toggle">
                {expandedSections.glassTypes ? '▼' : '▶'}
              </span>
              <h2>Glassetyper</h2>
            </div>
            <button
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation()
                setShowAddGlassType(true)
                setEditingGlassTypeIndex(null)
                setExpandedSections({ ...expandedSections, glassTypes: true })
              }}
            >
              + Legg til glassetype
            </button>
          </div>

          {expandedSections.glassTypes && (
            <div className="section-content">

          {showAddGlassType && (
            <GlassTypeForm
              onSave={(glassType) => {
                handleGlassTypeAdd(glassType)
                setShowAddGlassType(false)
              }}
              onCancel={() => setShowAddGlassType(false)}
            />
          )}

          <div className="list-items">
            {state.glassTypes.map((glassType, index) => (
              <div key={index} className="list-item">
                {editingGlassTypeIndex === index ? (
                  <GlassTypeForm
                    initialData={glassType}
                    onSave={(newGlassType) => {
                      handleGlassTypeUpdate(index, newGlassType)
                      setEditingGlassTypeIndex(null)
                    }}
                    onCancel={() => setEditingGlassTypeIndex(null)}
                  />
                ) : (
                  <>
                    <span className="list-item-text">
                      {glassType.name} ({glassType.volume}L)
                    </span>
                    <div className="list-item-actions">
                      <button
                        className="btn btn-edit"
                        onClick={() => {
                          setEditingGlassTypeIndex(index)
                          setShowAddGlassType(false)
                        }}
                      >
                        Rediger
                      </button>
                      <button
                        className="btn btn-delete"
                        onClick={() => handleGlassTypeDelete(index)}
                      >
                        Slett
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function BeerForm({ types, initialData, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    initialData || {
      name: '',
      type: types[0] || '',
      abv: 0,
      ibu: 0,
      ebc: 0,
      color: '#FFBF42',
      description: '',
      remainingLiters: 0,
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form className="beer-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>Navn</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>ABV (%)</label>
          <input
            type="number"
            step="0.1"
            value={formData.abv}
            onChange={(e) => setFormData({ ...formData, abv: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
        <div className="form-group">
          <label>IBU</label>
          <input
            type="number"
            value={formData.ibu}
            onChange={(e) => setFormData({ ...formData, ibu: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div className="form-group">
          <label>EBC</label>
          <input
            type="number"
            step="0.1"
            value={formData.ebc}
            onChange={(e) => {
              const ebcValue = parseFloat(e.target.value) || 0;
              setFormData({ 
                ...formData, 
                ebc: ebcValue,
                color: ebcToHex(ebcValue)
              });
            }}
            required
          />
        </div>
        <div className="form-group">
          <label>Farge</label>
          <input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Gjenstående (L)</label>
          <input
            type="number"
            step="0.1"
            value={formData.remainingLiters}
            onChange={(e) => setFormData({ ...formData, remainingLiters: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Beskrivelse</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows="3"
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-save">
          Lagre
        </button>
        <button type="button" className="btn btn-cancel" onClick={onCancel}>
          Avbryt
        </button>
      </div>
    </form>
  )
}

function TypeForm({ initialValue, onSave, onCancel }) {
  const [value, setValue] = useState(initialValue || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (value.trim()) {
      onSave(value.trim())
    }
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="inline-input"
        required
        autoFocus
      />
      <div className="inline-form-actions">
        <button type="submit" className="btn btn-save">
          Lagre
        </button>
        <button type="button" className="btn btn-cancel" onClick={onCancel}>
          Avbryt
        </button>
      </div>
    </form>
  )
}

function GlassTypeForm({ initialData, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    initialData || {
      name: '',
      volume: 0,
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      name: formData.name.trim(),
      volume: parseFloat(formData.volume) || 0,
    })
  }

  return (
    <form className="inline-form glass-type-form" onSubmit={handleSubmit}>
      <div className="inline-form-row">
        <input
          type="text"
          placeholder="Navn"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="inline-input"
          required
          autoFocus
        />
        <input
          type="number"
          placeholder="Volum (L)"
          step="0.01"
          value={formData.volume}
          onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
          className="inline-input"
          required
        />
      </div>
      <div className="inline-form-actions">
        <button type="submit" className="btn btn-save">
          Lagre
        </button>
        <button type="button" className="btn btn-cancel" onClick={onCancel}>
          Avbryt
        </button>
      </div>
    </form>
  )
}

export default AdminPage
