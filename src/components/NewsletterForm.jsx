import React, { useState } from 'react';
import { newsletterAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const NewsletterForm = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await newsletterAPI.subscribe(email, 'homepage');
      
      if (response.success) {
        toast.success(response.message);
        setEmail(''); // Clear form on success
      } else {
        toast.error(response.message || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      
      // Handle different error scenarios
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid email address');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Network error. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="newsletter-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <input
          type="email"
          placeholder="Enter your email address"
          className="newsletter-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />
        <button
          type="submit"
          className="btn btn-primary newsletter-btn"
          disabled={isLoading || !email.trim()}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner">⏳</span>
              Subscribing...
            </>
          ) : (
            'Subscribe Now'
          )}
        </button>
      </div>
    </form>
  );
};

export default NewsletterForm;