import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './SearchBar.css'

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const navigate = useNavigate()
  const searchInputRef = useRef(null)
  const searchContainerRef = useRef(null)

  // Sample suggestions
  const searchSuggestions = [
    'Cement',
    'TMT Steel',
    'Red Bricks',
    'River Sand',
    'Aggregates',
    'Concrete Blocks',
    'Steel Rods',
    'Construction Sand',
    'Fly Ash Bricks',
    'Plaster Sand'
  ]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        // Only hide suggestions, don't collapse the search bar
        setShowSuggestions(false)
        // Search bar stays expanded even when clicking outside
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)

    if (value.length > 0) {
      const filtered = searchSuggestions.filter(item =>
        item.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 5))
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSearch = (query = searchQuery) => {
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query.trim())}`)
      setShowSuggestions(false)
      // Keep search query and keep expanded
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      // Don't collapse the search bar, just hide suggestions
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion)
    handleSearch(suggestion)
  }

  const handleSearchIconClick = () => {
    if (!isExpanded) {
      setIsExpanded(true)
      setTimeout(() => searchInputRef.current?.focus(), 100)
    } else if (searchQuery.trim()) {
      handleSearch()
    } else {
      searchInputRef.current?.focus()
    }
  }

  const handleInputFocus = () => {
    if (!isExpanded) {
      setIsExpanded(true)
    }
    if (searchQuery.length > 0) {
      setShowSuggestions(true)
    }
  }

  // Handle input blur - don't collapse, just hide suggestions
  const handleInputBlur = () => {
    // Small delay to allow suggestion clicks to register
    setTimeout(() => {
      setShowSuggestions(false)
    }, 150)
    // Don't collapse the search bar (isExpanded stays true)
  }

  return (
    <div 
      className={`search-bar ${isExpanded ? 'expanded' : ''} persistent-expanded`}
      ref={searchContainerRef}
    >
      <div className="search-input-container">
        <button 
          className="search-icon-btn"
          onClick={handleSearchIconClick}
          aria-label="Search"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path 
              d="M21 21L16.514 16.506M19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
        
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for construction materials..."
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="search-input"
        />

        {searchQuery && (
          <button 
            className="clear-btn"
            onClick={() => {
              setSearchQuery('')
              setSuggestions([])
              setShowSuggestions(false)
              searchInputRef.current?.focus()
            }}
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path 
                d="M18 6L6 18M6 6L18 18" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="suggestion-item"
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="suggestion-icon">
                <path 
                  d="M21 21L16.514 16.506M19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBar
