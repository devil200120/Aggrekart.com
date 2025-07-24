import React, { useState, useEffect } from 'react'
import './ProductSearch.css'

const ProductSearch = ({ onSearch, initialValue = '' }) => {
  const [searchTerm, setSearchTerm] = useState(initialValue)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Popular search terms
  const popularSearches = [
    'Cement', 'TMT Steel', 'Bricks', 'Sand', 'Aggregates', 
    'Ready Mix Concrete', 'Roofing Tiles', 'PVC Pipes'
  ]

  useEffect(() => {
    setSearchTerm(initialValue)
  }, [initialValue])

  const handleSearch = (term = searchTerm) => {
    if (term.trim()) {
      onSearch(term.trim())
      setShowSuggestions(false)
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
      setSuggestions(filtered.slice(0, 5))
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion)
    handleSearch(suggestion)
  }

  const clearSearch = () => {
    setSearchTerm('')
    onSearch('')
    setShowSuggestions(false)
  }

  return (
    <div className="product-search">
      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onFocus={() => searchTerm.length > 1 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search for construction materials..."
            className="search-input"
          />
          
          {searchTerm && (
            <button 
              onClick={clearSearch}
              className="search-clear"
              type="button"
            >
              ✕
            </button>
          )}
          
          <button 
            onClick={() => handleSearch()}
            className="search-button"
            type="button"
          >
            🔍
          </button>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="search-suggestions">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="suggestion-item"
              >
                🔍 {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular Searches */}
      {!searchTerm && (
        <div className="popular-searches">
          <span className="popular-label">Popular:</span>
          {popularSearches.slice(0, 4).map((term, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(term)}
              className="popular-tag"
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductSearch