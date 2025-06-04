// src/components/ui/Tooltip.jsx
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente de Tooltip para exibir informações extras ao passar o mouse
 * 
 * @example
 * <Tooltip content="Este é um campo obrigatório">
 *   <InfoIcon className="text-gray-400" />
 * </Tooltip>
 */
const Tooltip = ({
  children,
  content,
  position = 'top',
  delay = 300,
  className = '',
  contentClassName = '',
  showArrow = true,
  maxWidth = '250px',
  disabled = false,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  const targetRef = useRef(null);
  const timeoutRef = useRef(null);

  // Gerencia a exibição do tooltip com delay
  const handleMouseEnter = () => {
    if (disabled) return;
    
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  // Posiciona o tooltip relativamente ao elemento alvo
  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !targetRef.current) return;

    const updatePosition = () => {
      const targetRect = targetRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = targetRect.top + scrollY - tooltipRect.height - 8;
          left = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'bottom':
          top = targetRect.bottom + scrollY + 8;
          left = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'left':
          top = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
          left = targetRect.left + scrollX - tooltipRect.width - 8;
          break;
        case 'right':
          top = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
          left = targetRect.right + scrollX + 8;
          break;
        default:
          top = targetRect.top + scrollY - tooltipRect.height - 8;
          left = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
      }

      // Evitar que o tooltip saia da viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (left < 0) left = 0;
      if (left + tooltipRect.width > viewportWidth) left = viewportWidth - tooltipRect.width;
      if (top < 0) top = 0;
      if (top + tooltipRect.height > viewportHeight + scrollY) top = viewportHeight + scrollY - tooltipRect.height;

      tooltipRef.current.style.top = `${top}px`;
      tooltipRef.current.style.left = `${left}px`;
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isVisible, position]);

  // Limpa timeout ao desmontar
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  // Classes para o arrow do tooltip
  const arrowClasses = {
    top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent',
    left: 'right-0 top-1/2 translate-x-full -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
    right: 'left-0 top-1/2 -translate-x-full -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent'
  };

  return (
    <div className="inline-block relative" {...props}>
      <div
        ref={targetRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 bg-gray-800 text-white px-2 py-1 rounded text-sm shadow-lg ${className}`}
          style={{ maxWidth }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          role="tooltip"
        >
          <div className={contentClassName}>{content}</div>
          
          {showArrow && (
            <div className={`absolute w-0 h-0 border-4 border-gray-800 ${arrowClasses[position]}`} />
          )}
        </div>
      )}
    </div>
  );
};

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  content: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  delay: PropTypes.number,
  className: PropTypes.string,
  contentClassName: PropTypes.string,
  showArrow: PropTypes.bool,
  maxWidth: PropTypes.string,
  disabled: PropTypes.bool
};

export default Tooltip;