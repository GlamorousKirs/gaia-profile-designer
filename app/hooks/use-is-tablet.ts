'use client';

import { useState, useEffect } from "react";

interface UseIsTabletReturn {
  isTablet: boolean;
  isLoading: boolean;
}

export const useIsTablet = (): UseIsTabletReturn => {
  const [isTablet, setIsTablet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkIsTablet = () => {
      const tabletQuery = window.matchMedia(
        "(min-width: 769px) and (max-width: 1024px)"
      );

      const userAgent = navigator.userAgent.toLowerCase();
      const tabletKeywords = [
        'ipad', 'tablet', 'kindle', 'silk', 'playbook', 'nexus 7',
        'nexus 9', 'nexus 10', 'galaxy tab', 'sm-t', 'gt-p', 'gt-n'
      ];

      const isTabletUA = tabletKeywords.some(keyword =>
        userAgent.includes(keyword)
      );

      const isIPad = /ipad|macintosh/.test(userAgent) && 'ontouchend' in document;

      const isTabletDevice = tabletQuery.matches ||
        isTabletUA ||
        isIPad ||
        (window.innerWidth >= 769 && window.innerWidth <= 1024 && 'ontouchstart' in window);

      setIsTablet(isTabletDevice);
      setIsLoading(false);
    };

    checkIsTablet();

    const tabletQuery = window.matchMedia(
      "(min-width: 769px) and (max-width: 1024px)"
    );
    const handleChange = () => checkIsTablet();

    if (tabletQuery.addEventListener) {
      tabletQuery.addEventListener('change', handleChange);
    } else if ('addListener' in tabletQuery) {
      (tabletQuery as any).addListener(handleChange);
    }

    window.addEventListener('resize', checkIsTablet);

    return () => {
      if (tabletQuery.removeEventListener) {
        tabletQuery.removeEventListener('change', handleChange);
      } else if ('removeListener' in tabletQuery) {
        (tabletQuery as any).removeListener(handleChange);
      }
      window.removeEventListener('resize', checkIsTablet);
    };
  }, []);

  return {
    isTablet,
    isLoading,
  };
};

export default useIsTablet;