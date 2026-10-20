import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface RouteMatch {
  path: string;
  pattern: string;
  params: Record<string, string>;
  search: string;
}

interface RouterContextType {
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  navigate: (to: string) => void;
  goBack: () => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

// Pattern matcher for simple paths and parameter routes like /product/:slug or /marketplace/category/:slug
function matchRoute(currentPath: string, pattern: string): { matched: boolean; params: Record<string, string> } {
  const patternSegments = pattern.split('/').filter(Boolean);
  const pathSegments = currentPath.split('/').filter(Boolean);

  if (patternSegments.length !== pathSegments.length) {
    return { matched: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternSegments.length; i++) {
    const patternPart = patternSegments[i];
    const pathPart = pathSegments[i];

    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      params[paramName] = decodeURIComponent(pathPart);
    } else if (patternPart !== pathPart) {
      return { matched: false, params: {} };
    }
  }

  return { matched: true, params };
}

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUrl, setCurrentUrl] = useState<string>(() => {
    return window.location.pathname + window.location.search;
  });

  const path = currentUrl.split('?')[0] || '/';
  const queryString = currentUrl.split('?')[1] || '';
  const query = new URLSearchParams(queryString);

  // Extract dynamic parameters
  const [params, setParams] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check known parameterized routes
    const parameterizedPatterns = [
      '/marketplace/category/:slug',
      '/product/:slug',
      '/seller/products/:id',
      '/admin/users/:id',
    ];

    let matchedParams: Record<string, string> = {};
    for (const pattern of parameterizedPatterns) {
      const match = matchRoute(path, pattern);
      if (match.matched) {
        matchedParams = match.params;
        break;
      }
    }
    setParams(matchedParams);
  }, [path]);

  const handlePopState = useCallback(() => {
    setCurrentUrl(window.location.pathname + window.location.search);
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handlePopState]);

  const navigate = useCallback((to: string) => {
    if (to === window.location.pathname + window.location.search) return;
    window.history.pushState(null, '', to);
    setCurrentUrl(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  return (
    <RouterContext.Provider value={{ path, params, query, navigate, goBack }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};

export const Link: React.FC<{
  to: string;
  className?: string;
  children: React.ReactNode;
  id?: string;
  onClick?: () => void;
}> = ({ to, className, children, id, onClick }) => {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow standard new-tab behavior on cmd/ctrl click
    if (e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    if (onClick) onClick();
    navigate(to);
  };

  return (
    <a id={id} href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};
