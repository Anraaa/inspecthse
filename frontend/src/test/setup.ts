import "@testing-library/jest-dom";

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = () => null;
  unobserve = () => null;
  disconnect = () => null;
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = () => null;
  unobserve = () => null;
  disconnect = () => null;
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => null,
    removeListener: () => null,
    addEventListener: () => null,
    removeEventListener: () => null,
    dispatchEvent: () => false,
  }),
});
