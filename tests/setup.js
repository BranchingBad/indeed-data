// tests/setup.js
// Global test setup for ES modules

// Mock browser APIs
global.performance = {
  now: () => Date.now()
};

global.Chart = class MockChart {
  constructor() {}
  destroy() {}
  update() {}
};

global.window = {
  Chart: global.Chart,
  ChartDataLabels: {},
  addEventListener: () => {},
  removeEventListener: () => {}
};

// Mock localStorage without jest.fn() - using plain functions
const localStorageMock = {
  storage: {},
  getItem(key) {
    return this.storage[key] || null;
  },
  setItem(key, value) {
    this.storage[key] = value;
  },
  removeItem(key) {
    delete this.storage[key];
  },
  clear() {
    this.storage = {};
  }
};
global.localStorage = localStorageMock;

// Mock document object
const createMockElement = () => ({
  innerHTML: '',
  innerText: '',
  textContent: '',
  classList: {
    add: () => {},
    remove: () => {},
    contains: () => false
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  setAttribute: () => {},
  appendChild: () => {},
  click: () => {}
});

global.document = {
  getElementById: () => createMockElement(),
  addEventListener: () => {},
  createElement: () => createMockElement(),
  body: {
    appendChild: () => {},
    removeChild: () => {}
  },
  querySelectorAll: () => []
};

console.log('✓ Test environment setup complete');
