/**
 * Jest test setup for ATP™ SDK
 */

// Mock WebSocket for Node.js environment
(global as any).WebSocket = jest.fn(() => ({
  readyState: 1,
  send: jest.fn(),
  close: jest.fn(),
  on: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

// Mock fetch for Node.js environment
(global as any).fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock performance API
(global as any).performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn()
};

// Mock AbortSignal
(global as any).AbortSignal = {
  timeout: jest.fn((delay: number) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), delay);
    return controller.signal;
  })
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(30000);

// Add at least one test to avoid empty test suite error
describe('Setup', () => {
  it('should initialize test environment', () => {
    expect(true).toBe(true);
  });
});