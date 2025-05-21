// src/components/ui/Card.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente Card reutilizável para envolver conteúdo em um contêiner visual
 * 
 * @example
 * <Card title="Resumo Financeiro">
 *   <p>Conteúdo do card</p>
 * </Card>
 * 
 * @example
 * <Card 
 *   title="Receitas" 
 *   subtitle="Maio 2025"
 *   icon={<TrendingUpIcon />}
 *   actionButton={<Button>Ver detalhes</Button>}
 *   variant="success"
 * >
 *   <p>R$ 2.500,00</p>
 * </Card>
 */
const Card = ({
  children,
  title = null,
  subtitle = null,
  icon = null,
  actionButton = null,
  footer = null,
  variant = 'default',
  hoverable = false,
  className = '',
  bodyClassName = '',
  onClick = null,
  ...props
}) => {
  const baseClasses = 'rounded-lg shadow-sm overflow-hidden';
  
  const variantClasses = {
    default: 'bg-white',
    primary: 'bg-blue-50 border border-blue-100',
    success: 'bg-green-50 border border-green-100',
    warning: 'bg-amber-50 border border-amber-100',
    danger: 'bg-red-50 border border-red-100',
    info: 'bg-cyan-50 border border-cyan-100',
    purple: 'bg-purple-50 border border-purple-100'
  };
  
  const hoverClasses = hoverable ? 'hover:shadow-md transition-shadow duration-200' : '';
  const cursorClasses = onClick ? 'cursor-pointer' : '';
  
  const cardClasses = [
    baseClasses,
    variantClasses[variant],
    hoverClasses,
    cursorClasses,
    className
  ].join(' ');

  return (
    <div 
      className={cardClasses} 
      onClick={onClick}
      {...props}
    >
      {/* Card Header */}
      {(title || icon || actionButton) && (
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon && <div className="text-gray-700">{icon}</div>}
            <div>
              {title && <h3 className="font-medium text-gray-800">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>
          
          {actionButton && (
            <div>{actionButton}</div>
          )}
        </div>
      )}
      
      {/* Card Body */}
      <div className={`p-4 ${bodyClassName}`}>
        {children}
      </div>
      
      {/* Card Footer */}
      {footer && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  icon: PropTypes.node,
  actionButton: PropTypes.node,
  footer: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'primary', 'success', 'warning', 'danger', 'info', 'purple']),
  hoverable: PropTypes.bool,
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
  onClick: PropTypes.func
};

export default Card;