import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

function LandingPage() {
  const [beers, setBeers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGlass, setSelectedGlass] = useState(null)
  const [selectedBeer, setSelectedBeer] = useState(null)
  const [glassTypes, setGlassTypes] = useState([])
  const [fullState, setFullState] = useState(null)
  const [fillLevel, setFillLevel] = useState(0) // 0 to 1, representing fill percentage
  const [isDragging, setIsDragging] = useState(false)
  const [initialBeerRemaining, setInitialBeerRemaining] = useState(null)
  const [isPouring, setIsPouring] = useState(false) // Track if we're in the 2-second pour delay
  const [lastPour, setLastPour] = useState(null) // Track last pour for undo: { tapNumber, previousRemaining, fillAmount }
  const fillLevelRef = useRef(0)
  const glassElementRef = useRef(null)
  const pourTimeoutRef = useRef(null)

  useEffect(() => {
    fetchState()
  }, [])

  const fetchState = useCallback(async () => {
    try {
      const response = await fetch('/api/state')
      const data = await response.json()
      
      setFullState(data)
      const glassTypesList = data.glassTypes || []
      setGlassTypes(glassTypesList)
      
      // Set first glass as selected by default
      if (glassTypesList.length > 0) {
        setSelectedGlass(glassTypesList[0])
      }
      
      // Extract beers in order: line1, line2, line3
      const beersOnTap = [
        { ...data.onTap.line1, tapNumber: 1 },
        { ...data.onTap.line2, tapNumber: 2 },
        { ...data.onTap.line3, tapNumber: 3 }
      ]
      
      setBeers(beersOnTap)
      setLoading(false)
    } catch (error) {
      console.error('Feil ved henting av tilstand:', error)
      setLoading(false)
    }
  }, [])

  const handleBeerClick = (beer) => {
    if (!selectedGlass) return
    
    // Cancel any existing pour timeout
    if (pourTimeoutRef.current) {
      clearTimeout(pourTimeoutRef.current)
      pourTimeoutRef.current = null
    }
    
    // Select the beer for filling
    setSelectedBeer(beer)
    fillLevelRef.current = 0
    setFillLevel(0)
    setInitialBeerRemaining(beer.remainingLiters)
    setIsPouring(false)
  }

  useEffect(() => {
    const getClientY = (e) => {
      if (e.touches && e.touches.length > 0) {
        return e.touches[0].clientY
      }
      return e.clientY
    }

    const handleMove = (e) => {
      if (!isDragging || !selectedBeer || !selectedGlass) return
      
      const glassElement = glassElementRef.current
      if (!glassElement) return
      
      // Get the glass-outline element (the actual liquid container)
      const glassOutline = glassElement.querySelector('.glass-outline')
      if (!glassOutline) return
      
      const outlineRect = glassOutline.getBoundingClientRect()
      const clientY = getClientY(e)
      const y = clientY - outlineRect.top
      const height = outlineRect.height
      
      // Calculate fill level (inverted: bottom is 1, top is 0)
      // Since glass-outline is rotated 180deg, we need to account for that
      const newFillLevel = Math.max(0, Math.min(1, 1 - (y / height)))
      fillLevelRef.current = newFillLevel
      setFillLevel(newFillLevel)

      // Calculate how much beer to subtract
      const fillAmount = newFillLevel * selectedGlass.volume
      const newRemaining = Math.max(0, initialBeerRemaining - fillAmount)
      
      // Update local state immediately using functional update
      setBeers(prevBeers => 
        prevBeers.map(b => 
          b.tapNumber === selectedBeer.tapNumber 
            ? { ...b, remainingLiters: newRemaining }
            : b
        )
      )
    }

    const handleEnd = () => {
      if (!isDragging || !selectedBeer || !selectedGlass) return
      setIsDragging(false)
      glassElementRef.current = null
      // Don't update server here - wait for Pour button
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMove)
      document.addEventListener('mouseup', handleEnd)
      document.addEventListener('touchmove', handleMove, { passive: false })
      document.addEventListener('touchend', handleEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('mouseup', handleEnd)
        document.removeEventListener('touchmove', handleMove)
        document.removeEventListener('touchend', handleEnd)
      }
    }
  }, [isDragging, selectedBeer, selectedGlass, initialBeerRemaining, fullState])

  const handleGlassFillStart = (e) => {
    if (!selectedBeer || !selectedGlass) return
    e.preventDefault()
    
    // Store the glass element reference
    const glassElement = e.currentTarget
    glassElementRef.current = glassElement
    
    // Get the glass-outline element (the actual liquid container)
    const glassOutline = glassElement.querySelector('.glass-outline')
    if (!glassOutline) return
    
    const outlineRect = glassOutline.getBoundingClientRect()
    // Support both mouse and touch events
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY
    const y = clientY - outlineRect.top
    const height = outlineRect.height
    const newFillLevel = Math.max(0, Math.min(1, 1 - (y / height)))
    fillLevelRef.current = newFillLevel
    setFillLevel(newFillLevel)
    setIsDragging(true)
  }

  const resetPour = () => {
    // Cancel any existing pour timeout
    if (pourTimeoutRef.current) {
      clearTimeout(pourTimeoutRef.current)
      pourTimeoutRef.current = null
    }
    
    if (selectedBeer && initialBeerRemaining !== null) {
      // Revert to initial state without updating server
      setBeers(prevBeers => 
        prevBeers.map(b => 
          b.tapNumber === selectedBeer.tapNumber 
            ? { ...b, remainingLiters: initialBeerRemaining }
            : b
        )
      )
    }
    setSelectedBeer(null)
    fillLevelRef.current = 0
    setFillLevel(0)
    setInitialBeerRemaining(null)
    setIsDragging(false)
    setIsPouring(false)
    glassElementRef.current = null
  }

  const handlePour = useCallback(async () => {
    if (!selectedBeer || !selectedGlass || fillLevelRef.current <= 0) return

    // Get current fill level for final calculation
    const currentFillLevel = fillLevelRef.current
    const fillAmount = currentFillLevel * selectedGlass.volume
    const newRemaining = Math.max(0, initialBeerRemaining - fillAmount)

    // Update server state
    try {
      const updatedState = {
        ...fullState,
        onTap: {
          ...fullState.onTap,
          [`line${selectedBeer.tapNumber}`]: {
            ...fullState.onTap[`line${selectedBeer.tapNumber}`],
            remainingLiters: newRemaining
          }
        }
      }

      const response = await fetch('/api/state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedState)
      })

      if (response.ok) {
        setFullState(updatedState)
        setInitialBeerRemaining(newRemaining)
        // Store last pour info for undo (only if we have valid data)
        if (initialBeerRemaining !== null && selectedBeer) {
          const lastPourData = {
            tapNumber: selectedBeer.tapNumber,
            previousRemaining: initialBeerRemaining,
            fillAmount: fillAmount
          }
          console.log('Setting lastPour:', lastPourData)
          setLastPour(lastPourData)
        }
        // Update local beers state
        setBeers(prevBeers => 
          prevBeers.map(b => 
            b.tapNumber === selectedBeer.tapNumber 
              ? { ...b, remainingLiters: newRemaining }
              : b
          )
        )
        // Reset the glass after pouring
        fillLevelRef.current = 0
        setFillLevel(0)
        setSelectedBeer(null)
        setInitialBeerRemaining(null)
        setIsPouring(false)
        glassElementRef.current = null
      } else {
        // Revert on error
        fetchState()
      }
    } catch (error) {
      console.error('Feil ved oppdatering av tilstand:', error)
      // Revert on error
      fetchState()
    }
  }, [selectedBeer, selectedGlass, initialBeerRemaining, fullState, fetchState])

  // Auto-pour after 2 seconds when beer is selected and fill level > 0
  useEffect(() => {
    // Cancel any existing timeout
    if (pourTimeoutRef.current) {
      clearTimeout(pourTimeoutRef.current)
      pourTimeoutRef.current = null
    }

    // Only start auto-pour if we have a selected beer, glass, and fill level > 0
    // and we're not currently dragging
    if (selectedBeer && selectedGlass && fillLevel > 0 && !isDragging) {
      setIsPouring(true)
      
      // Set timeout for 2 seconds
      pourTimeoutRef.current = setTimeout(() => {
        handlePour()
        setIsPouring(false)
        pourTimeoutRef.current = null
      }, 2000)
    } else {
      setIsPouring(false)
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (pourTimeoutRef.current) {
        clearTimeout(pourTimeoutRef.current)
        pourTimeoutRef.current = null
      }
    }
  }, [selectedBeer, selectedGlass, fillLevel, isDragging, handlePour])

  const handleUndo = useCallback(async () => {
    if (!lastPour || !fullState) return

    const { tapNumber, previousRemaining } = lastPour
    const restoredRemaining = Math.min(previousRemaining, fullState.onTap[`line${tapNumber}`].liters)

    try {
      const updatedState = {
        ...fullState,
        onTap: {
          ...fullState.onTap,
          [`line${tapNumber}`]: {
            ...fullState.onTap[`line${tapNumber}`],
            remainingLiters: restoredRemaining
          }
        }
      }

      const response = await fetch('/api/state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedState)
      })

      if (response.ok) {
        setFullState(updatedState)
        // Update local beers state
        setBeers(prevBeers => 
          prevBeers.map(b => 
            b.tapNumber === tapNumber 
              ? { ...b, remainingLiters: restoredRemaining }
              : b
          )
        )
        // Clear last pour after undo
        setLastPour(null)
      } else {
        fetchState()
      }
    } catch (error) {
      console.error('Feil ved angre:', error)
      fetchState()
    }
  }, [lastPour, fullState, fetchState])

  const handlePageClick = (e) => {
    // Don't reset if clicking on interactive elements
    const target = e.target
    const isBeerCard = target.closest('.beer-card')
    const isGlassButton = target.closest('.glass-button')
    const isGlassVisual = target.closest('.glass-visual')
    const isAdminLink = target.closest('.admin-link')
    const isActionButton = target.closest('.glass-action-buttons')
    const isUndoButton = target.closest('.bottom-right-button')
    
    // Only reset if we have a selected beer and clicked outside interactive elements
    if (selectedBeer && !isBeerCard && !isGlassButton && !isGlassVisual && !isAdminLink && !isActionButton && !isUndoButton) {
      resetPour()
    }
  }

  if (loading) {
    return (
      <div className="landing-page">
        <div className="loading">Laster...</div>
      </div>
    )
  }

  return (
    <div className="landing-page" onClick={handlePageClick}>
      <main className="beer-list">
        {beers.map((beer) => (
          <div 
            key={beer.tapNumber} 
            className={`beer-card ${selectedGlass && !selectedBeer ? 'beer-card-selectable' : ''} ${selectedBeer?.tapNumber === beer.tapNumber ? 'beer-card-selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              handleBeerClick(beer)
            }}
          >
            <div 
              className="beer-fill-indicator"
              style={{
                height: `${((beer.remainingLiters || 0) / (beer.liters || 1)) * 100}%`,
                backgroundColor: beer.color
              }}
            />
            <div className="beer-header">
              <div className="tap-number">Tapp {beer.tapNumber}</div>
              <div 
                className="beer-color-indicator" 
                style={{ backgroundColor: beer.color }}
              />
            </div>
            
            <h2 className="beer-name">{beer.name}</h2>
            <p className="beer-type">{beer.type}</p>
            
            <div className="beer-stats">
              <div className="stat">
                <span className="stat-label">ABV</span>
                <span className="stat-value">{beer.abv}%</span>
              </div>
              <div className="stat">
                <span className="stat-label">IBU</span>
                <span className="stat-value">{beer.ibu}</span>
              </div>
              <div className="stat">
                <span className="stat-label">EBC</span>
                <span className="stat-value">{beer.ebc}</span>
              </div>
            </div>
            
            {beer.description && (
              <p className="beer-description">{beer.description}</p>
            )}
            
            <div className="remaining">
              <span className="remaining-label">Gjenstående:</span>
              <span className="remaining-value">{beer.remainingLiters.toFixed(2)}L</span>
            </div>
          </div>
        ))}
      </main>

      <div className="glass-display-section">
        {selectedGlass ? (
          <div className="glass-display-container">
            {(() => {
              // Determine glass type class for styling
              const glassType = selectedGlass.name.toLowerCase()
              let glassTypeClass = 'glass-type-stem'
              if (glassType.includes('høyt')) {
                glassTypeClass = 'glass-type-stem-tall'
              } else if (glassType.includes('lavt')) {
                glassTypeClass = 'glass-type-stem-short'
              } else if (glassType.includes('stort')) {
                glassTypeClass = 'glass-type-stem-large'
              } else if (glassType.includes('seidel')) {
                glassTypeClass = 'glass-type-seidel'
              }
              const isSeidel = glassType.includes('seidel')
              
              return (
                <div 
                  className={`glass-visual ${glassTypeClass} ${selectedBeer ? 'glass-ready' : ''} ${isDragging ? 'glass-dragging' : ''}`}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    handleGlassFillStart(e)
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation()
                    handleGlassFillStart(e)
                  }}
                >
                  <div className="glass-bowl-container">
                    <div className="glass-outline">
                      <div 
                        className="glass-liquid"
                        style={{
                          height: `${fillLevel * 100}%`,
                          backgroundColor: selectedBeer?.color || '#FFD700',
                          transition: isDragging ? 'none' : 'height 0.3s ease'
                        }}
                      />
                    {fillLevel > 0 && (
                      <div className="glass-foam" style={{ top: `${fillLevel * 100}%` }} />
                    )}
                    {isPouring && fillLevel > 0 && (
                      <div className="bubbles-container" style={{ height: `${fillLevel * 100}%` }}>
                        {[...Array(15)].map((_, i) => (
                          <div
                            key={i}
                            className="bubble"
                            style={{
                              left: `${10 + (i * 6) % 80}%`,
                              animationDelay: `${(i * 0.1)}s`,
                              animationDuration: `${1.5 + (i % 3) * 0.3}s`
                            }}
                          />
                        ))}
                      </div>
                    )}
                    </div>
                  </div>
                  {!isSeidel && (
                    <>
                      <div className="glass-rod"></div>
                      <div className="glass-base"></div>
                    </>
                  )}
                </div>
              )
            })()}
          </div>
        ) : (
          <div className="glass-display-placeholder"></div>
        )}
      </div>
      <div className="glass-selection">

        <div className="glass-buttons">
          {glassTypes.map((glass, index) => {
            // Determine glass type for styling
            const glassType = glass.name.toLowerCase()
            let glassClass = 'glass-icon-stem'
            if (glassType.includes('høyt')) {
              glassClass = 'glass-icon-stem-tall'
            } else if (glassType.includes('lavt')) {
              glassClass = 'glass-icon-stem-short'
            } else if (glassType.includes('stort')) {
              glassClass = 'glass-icon-stem-large'
            } else if (glassType.includes('seidel')) {
              glassClass = 'glass-icon-seidel'
            }
            
            return (
              <button
                key={index}
                className={`glass-button ${selectedGlass === glass ? 'glass-button-selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedGlass(glass)
                }}
              >
                <div className={`glass-icon ${glassClass}`}>
                  <div className="glass-icon-bowl"></div>
                  {!glassType.includes('seidel') && (
                    <>
                      <div className="glass-icon-stem-part"></div>
                      <div className="glass-icon-base"></div>
                    </>
                  )}
                </div>
                <span className="glass-name">{glass.name}</span>
                <span className="glass-volume">{glass.volume}L</span>
              </button>
            )
          })}
        </div>
      </div>
      {lastPour && (
        <button 
          className="bottom-right-button"
          onClick={(e) => {
            e.stopPropagation()
            handleUndo()
          }}
          title={`Angre: Tilbake ${lastPour.fillAmount.toFixed(2)}L til Tapp ${lastPour.tapNumber}`}
        >
          Angre
        </button>
      )}
    </div>
  )
}

export default LandingPage

