import React, { useState, useEffect, useRef } from 'react'
import './ProductSearch.css'

const ProductSearch = ({ onSearch, initialValue = '' }) => {
  const [searchTerm, setSearchTerm] = useState(initialValue)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const searchRef = useRef(null)

  // Popular search terms for construction materials
  const popularSearches = [
    'Cement', 'TMT Steel', 'Red Bricks', 'Sand', 'Aggregates',
    'Ready Mix Concrete', 'Roofing Tiles', 'PVC Pipes', 'Steel Bars', 'Concrete Blocks'
  ]

  useEffect(() => {
    setSearchTerm(initialValue)
  }, [initialValue])

  const handleSearch = (term = searchTerm) => {
    if (term.trim()) {
      onSearch(term.trim())
      setShowSuggestions(false)
      setIsFocused(false)
      // Blur the input on mobile after search
      if (searchRef.current) {
        searchRef.current.blur()
      }
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    
    if (value.length > 1) {
      // Filter popular searches based on input
      const filtered = popularSearches.filter(item =>
        item.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 6))
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      setIsFocused(false)
      if (searchRef.current) {
        searchRef.current.blur()
      }
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
    if (searchTerm.length > 1) {
      setShowSuggestions(true)
    }
  }

  const handleBlur = () => {
    // Delay to allow clicking on suggestions
    setTimeout(() => {
      setShowSuggestions(false)
      setIsFocused(false)
    }, 200)
  }

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion)
    handleSearch(suggestion)
  }

  const clearSearch = () => {
    setSearchTerm('')
    onSearch('')
    setShowSuggestions(false)
    setIsFocused(false)
    if (searchRef.current) {
      searchRef.current.focus()
    }
  }

  return (
    <div className="product-search">
      {/* Main Search Container */}
      <div className="search-container">
        <div className={`search-input-wrapper ${isFocused ? 'focused' : ''} ${searchTerm ? 'has-value' : ''}`}>
          {/* Search Icon */}
          <div className="search-icon-container">
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Search Input */}
          <input
            ref={searchRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Search construction materials..."
            className="search-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          {/* Clear Button */}
          {searchTerm && (
            <button 
              onClick={clearSearch}
              className="clear-button"
              type="button"
              aria-label="Clear search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Search Button */}
          <button 
            onClick={() => handleSearch()}
            className="search-button"
            type="button"
            aria-label="Search"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="search-suggestions">
            <div className="suggestions-header">
              <span className="suggestions-title">Suggested searches</span>
            </div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="suggestion-item"
                type="button"
              >
                <svg className="suggestion-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="suggestion-text">{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular Searches - Only show when not focused and no search term */}
      {!isFocused && !searchTerm && (
        <div className="popular-searches">
          <div className="popular-header">
            <svg className="popular-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="popular-label">Popular searches</span>
          </div>
          <div className="popular-tags">
            {popularSearches.slice(0, 5).map((term, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(term)}
                className="popular-tag"
                type="button"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Search Display */}
      {searchTerm && !isFocused && (
        <div className="active-search">
          <span className="active-search-label">Searching for:</span>
          <span className="active-search-term">"{searchTerm}"</span>
          <button 
            onClick={clearSearch}
            className="active-search-clear"
            type="button"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}

export default ProductSearch