// src/components/layout/PageContainer.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente envoltório para páginas com padronização de layout
 * 
 * @example
 * <PageContainer 
 *   title="Dashboard" 
 *   subtitle="Resumo de Maio 2025"
 *   actions={<Button>Nova transação</Button>}
 * >
 *   {/* Conteúdo da página */}
 * </PageContainer>
 */
const PageContainer = ({
  children,
  title = null,
  subtitle = null,
  actions = null,
  breadcrumbs = null,
  maxWidth = '7xl',
  className = '',
  contentClassName = '',
  ...props
}) => {
  const containerClasses = `max-w-${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`;
  
  return (
    <main className={containerClasses} {...props}>
      {/* Cabeçalho da página */}
      {(title || subtitle || actions || breadcrumbs) && (
        <div className="mb-6">
          {/* Breadcrumbs */}
          {breadcrumbs && (
            <div className="mb-2">{breadcrumbs}</div>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              {title && (
                <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
            
            {actions && (
              <div className="mt-4 sm:mt-0">{actions}</div>
            )}
          </div>
        </div>
      )}
      
      {/* Conteúdo da página */}
      <div className={contentClassName}>
        {children}
      </div>
    </main>
  );
};

PageContainer.propTypes = {
  children: PropTypes.node,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  actions: PropTypes.node,
  breadcrumbs: PropTypes.node,
  maxWidth: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full']),
  className: PropTypes.string,
  contentClassName: PropTypes.string
};

export default PageContainer;