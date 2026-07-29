# Custom Hooks Patterns

## Overview

This guide explains how to create and use custom React hooks following FlytBase patterns and best practices.

## Reference App

**mission-planner** - Extensive custom hooks for mission management, state, and API interactions

## Basic Hook Structure

### Simple State Hook

**File**: `src/hooks/useToggle.ts`

```typescript
import { useState, useCallback } from 'react';

/**
 * useToggle Hook
 *
 * Manages boolean state with toggle functionality.
 *
 * @param initialValue - Initial boolean value
 * @returns Array with current value, toggle function, set function
 *
 * @example
 * const [isOpen, toggleOpen, setIsOpen] = useToggle(false);
 */
export function useToggle(initialValue = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  return [value, toggle, setValue];
}
```

### Hook with Parameters

**File**: `src/hooks/useLocalStorage.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';

/**
 * useLocalStorage Hook
 *
 * Syncs state with localStorage.
 *
 * @param key - localStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns Array with current value and setter function
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Get initial value from localStorage
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function for same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}
```

## API Data Fetching Hooks

### Using React Query

**File**: `src/hooks/useUsers.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosInstance } from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
}

/**
 * useUsers Hook
 *
 * Fetches and manages users data with React Query.
 */
export function useUsers(httpClient: AxiosInstance) {
  const queryClient = useQueryClient();

  // Fetch users list
  const {
    data: users,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await httpClient.get<User[]>('/api/users');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (newUser: Omit<User, 'id'>) => {
      const response = await httpClient.post<User>('/api/users', newUser);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const response = await httpClient.patch<User>(`/api/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await httpClient.delete(`/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    users,
    isLoading,
    error,
    refetch,
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
  };
}
```

## Form Hooks

### Form State Management

**File**: `src/hooks/useForm.ts`

```typescript
import { useState, useCallback, ChangeEvent, FormEvent } from 'react';

interface ValidationRules<T> {
  [key: string]: (value: any) => string | undefined;
}

interface UseFormOptions<T> {
  initialValues: T;
  validate?: ValidationRules<T>;
  onSubmit: (values: T) => void | Promise<void>;
}

/**
 * useForm Hook
 *
 * Manages form state, validation, and submission.
 */
export function useForm<T extends Record<string, any>>({ initialValues, validate, onSubmit }: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  // Handle blur
  const handleBlur = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));

      // Validate this field
      if (validate && validate[name]) {
        const error = validate[name](values[name as keyof T]);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [validate, values]
  );

  // Validate all fields
  const validateForm = useCallback(() => {
    if (!validate) return true;

    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validate).forEach((key) => {
      const error = validate[key](values[key as keyof T]);
      if (error) {
        newErrors[key as keyof T] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validate, values]);

  // Handle submit
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {});
      setTouched(allTouched);

      // Validate
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateForm, onSubmit]
  );

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setValues,
    setFieldValue: (name: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));
    },
  };
}
```

## Event Listener Hooks

### Window Event Hook

**File**: `src/hooks/useEventListener.ts`

```typescript
import { useEffect, useRef } from 'react';

/**
 * useEventListener Hook
 *
 * Attaches event listener to element with cleanup.
 *
 * @param eventName - Event name (e.g., 'click', 'resize')
 * @param handler - Event handler function
 * @param element - Target element (defaults to window)
 */
export function useEventListener<K extends keyof WindowEventMap>(eventName: K, handler: (event: WindowEventMap[K]) => void, element: Window | HTMLElement | null = window) {
  const savedHandler = useRef(handler);

  // Update ref when handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element) return;

    const eventListener = (event: Event) => {
      savedHandler.current(event as WindowEventMap[K]);
    };

    element.addEventListener(eventName, eventListener);

    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}
```

## Debounce Hook

**File**: `src/hooks/useDebounce.ts`

```typescript
import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 *
 * Debounces a value by delaying updates.
 *
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

## Best Practices

1. **Name hooks with 'use' prefix** - Required by React rules
2. **Document with JSDoc** - Explain parameters and return values
3. **Use TypeScript** - Add proper type annotations
4. **Memoize callbacks** - Use useCallback for functions passed as dependencies
5. **Clean up effects** - Always return cleanup functions from useEffect
6. **Avoid breaking rules of hooks** - Don't call hooks conditionally
7. **Extract common logic** - Create custom hooks for reusable patterns
8. **Keep hooks focused** - Single responsibility per hook
9. **Return objects for complex hooks** - Easier to destructure and maintain
10. **Test hooks** - Use @testing-library/react-hooks

## Common Hook Patterns

### Mounting Detection

```typescript
const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true);
}, []);
```

### Previous Value

```typescript
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
```

### Window Size

```typescript
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
```

### Intersection Observer

```typescript
function useIntersection(ref: RefObject<HTMLElement>, options?: IntersectionObserverInit) {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIntersecting(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}
```
