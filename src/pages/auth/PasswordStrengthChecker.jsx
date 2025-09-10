import React, { useState, useMemo } from 'react';
import './PasswordStrengthChecker.css';

const PasswordStrengthChecker = ({ password, onStrengthChange, showPassword, onTogglePassword }) => {
  // Password strength validation rules
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, level: 'none', feedback: [] };
    
    const rules = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      noCommon: !['password', 'Password', '12345678', 'qwerty', 'admin', 'login'].some(common => 
        password.toLowerCase().includes(common.toLowerCase())
      )
    };

    const score = Object.values(rules).filter(Boolean).length;
    
    let level, color;
    if (score <= 2) { level = 'Very Weak'; color = '#ef4444'; }
    else if (score <= 3) { level = 'Weak'; color = '#f59e0b'; }
    else if (score <= 4) { level = 'Fair'; color = '#eab308'; }
    else if (score <= 5) { level = 'Good'; color = '#3b82f6'; }
    else { level = 'Strong'; color = '#10b981'; }

    const feedback = [];
    if (!rules.length) feedback.push('At least 8 characters');
    if (!rules.uppercase) feedback.push('One uppercase letter (A-Z)');
    if (!rules.lowercase) feedback.push('One lowercase letter (a-z)');
    if (!rules.numbers) feedback.push('One number (0-9)');
    if (!rules.special) feedback.push('One special character (!@#$%^&*)');
    if (!rules.noCommon) feedback.push('Avoid common passwords');

    return { score, level, color, rules, feedback, isValid: score >= 4 };
  };

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  // Notify parent component of strength changes
  React.useEffect(() => {
    if (onStrengthChange) {
      onStrengthChange(strength);
    }
  }, [strength, onStrengthChange]);

  if (!password) return null;

  return (
    <div className="password-strength-checker">
      {/* Strength Meter */}
      <div className="strength-meter">
        <div className="strength-bar">
          <div 
            className="strength-fill"
            style={{ 
              width: `${(strength.score / 6) * 100}%`,
              backgroundColor: strength.color 
            }}
          />
        </div>
        <span className="strength-label" style={{ color: strength.color }}>
          {strength.level}
        </span>
      </div>

      {/* Individual Requirements */}
      <div className="password-rules">
        <div className={`rule ${strength.rules.length ? 'valid' : 'invalid'}`}>
          <span className="rule-icon">{strength.rules.length ? '✅' : '❌'}</span>
          <span className="rule-text">At least 8 characters</span>
        </div>
        <div className={`rule ${strength.rules.uppercase ? 'valid' : 'invalid'}`}>
          <span className="rule-icon">{strength.rules.uppercase ? '✅' : '❌'}</span>
          <span className="rule-text">One uppercase letter (A-Z)</span>
        </div>
        <div className={`rule ${strength.rules.lowercase ? 'valid' : 'invalid'}`}>
          <span className="rule-icon">{strength.rules.lowercase ? '✅' : '❌'}</span>
          <span className="rule-text">One lowercase letter (a-z)</span>
        </div>
        <div className={`rule ${strength.rules.numbers ? 'valid' : 'invalid'}`}>
          <span className="rule-icon">{strength.rules.numbers ? '✅' : '❌'}</span>
          <span className="rule-text">One number (0-9)</span>
        </div>
        <div className={`rule ${strength.rules.special ? 'valid' : 'invalid'}`}>
          <span className="rule-icon">{strength.rules.special ? '✅' : '❌'}</span>
          <span className="rule-text">One special character (!@#$%^&*)</span>
        </div>
        <div className={`rule ${strength.rules.noCommon ? 'valid' : 'invalid'}`}>
          <span className="rule-icon">{strength.rules.noCommon ? '✅' : '❌'}</span>
          <span className="rule-text">No common weak patterns</span>
        </div>
      </div>

      {/* Helpful Suggestions */}
      
    </div>
  );
};

export default PasswordStrengthChecker;