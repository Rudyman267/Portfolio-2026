import { useEffect } from 'react';

/**
 * Custom hook for detecting clicks outside of specified elements
 * @param refs - Array of refs to elements that should not trigger the callback when clicked
 * @param callback - Function to call when clicking outside
 * @param enabled - Whether the hook should be active
 */
export const useClickOutside = (
  refs: React.RefObject<HTMLElement>[],
  callback: () => void,
  enabled = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutside = refs.every(
        (ref) => ref.current && !ref.current.contains(target)
      );

      if (isOutside) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [refs, callback, enabled]);
};
