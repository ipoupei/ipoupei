// src/modules/diagnostico/components/OptionCard.jsx
import React from 'react';

const OptionCard = ({
  value,
  titulo,
  descricao,
  subtitle,
  color = 'blue',
  icone,
  isSelected = false,
  onClick,
  size = 'medium', // 'small', 'medium', 'large'
  disabled = false
}) => {
  
  const getColorStyles = (colorName) => {
    const colors = {
      blue: '#3b82f6',
      green: '#10b981',
      red: '#ef4444',
      orange: '#f59e0b',
      purple: '#8b5cf6',
      pink: '#ec4899',
      gray: '#6b7280'
    };
    return colors[colorName] || colors.blue;
  };

  const getSizeStyles = (sizeType) => {
    const sizes = {
      small: {
        padding: '1rem',
        iconSize: '40px',
        titleSize: '1rem',
        descSize: '0.8rem'
      },
      medium: {
        padding: '1.5rem',
        iconSize: '56px',
        titleSize: '1.125rem',
        descSize: '0.875rem'
      },
      large: {
        padding: '2rem',
        iconSize: '72px',
        titleSize: '1.25rem',
        descSize: '1rem'
      }
    };
    return sizes[sizeType] || sizes.medium;
  };

  const colorValue = getColorStyles(color);
  const sizeStyles = getSizeStyles(size);

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(value);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: sizeStyles.padding,
        border: `3px solid ${isSelected ? colorValue : '#e5e7eb'}`,
        borderRadius: '12px',
        background: isSelected ? `${colorValue}10` : 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        marginBottom: '1rem',
        transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isSelected 
          ? `0 4px 12px ${colorValue}40` 
          : '0 2px 4px rgba(0,0,0,0.1)',
        opacity: disabled ? 0.5 : 1
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isSelected) {
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isSelected) {
          e.currentTarget.style.borderColor = '#e5e7eb';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }
      }}
    >
      {/* Icon */}
      <div style={{
        width: sizeStyles.iconSize,
        height: sizeStyles.iconSize,
        borderRadius: '12px',
        background: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size === 'small' ? '1.2rem' : size === 'large' ? '2rem' : '1.5rem',
        flexShrink: 0
      }}>
        {icone || '📋'}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <h3 style={{
          fontSize: sizeStyles.titleSize,
          fontWeight: '700',
          margin: '0 0 0.25rem 0',
          color: '#1f2937'
        }}>
          {titulo}
        </h3>
        <p style={{
          fontSize: sizeStyles.descSize,
          color: '#6b7280',
          margin: subtitle ? '0 0 0.25rem 0' : 0
        }}>
          {descricao}
        </p>
        {subtitle && (
          <p style={{
            fontSize: '0.8rem',
            color: colorValue,
            margin: 0,
            fontWeight: '500'
          }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: colorValue,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.875rem',
          fontWeight: '700'
        }}>
          ✓
        </div>
      )}
    </div>
  );
};

export default OptionCard;