import { describe, it, expect, vi } from 'vitest';
import { Component } from '../../../src/mx/c4/Component.mjs';

// Mock dependencies
vi.mock('html-entities', () => ({
  encode: vi.fn((str) => `encoded:${str}`)
}));

vi.mock('html-minifier-terser', () => ({
  minify: vi.fn((html) => Promise.resolve(`minified:${html}`))
}));

vi.mock('cheerio', () => ({
  load: vi.fn(() => {
    const mockCheerio = vi.fn((selector) => ({
      attr: vi.fn()
    }));
    mockCheerio.html = vi.fn(() => '<div>test</div>');
    return mockCheerio;
  })
}));

describe('Component', () => {
  it('should generate label with proper HTML structure', async () => {
    const label = await Component.label();
    
    expect(label).toContain('encoded:');
    expect(label).toContain('minified:');
  });

  it('should generate style string with correct properties', () => {
    const style = Component.style();
    
    expect(style).toContain('rounded=1');
    expect(style).toContain('whiteSpace=wrap');
    expect(style).toContain('html=1');
    expect(style).toContain('fillColor=#63BEF2');
    expect(style).toContain('fontColor=#ffffff');
    expect(style).toContain('strokeColor=#2086C9');
    expect(style).toContain('align=center');
    expect(style).toContain('verticalAlign=top');
    expect(style).toContain('arcSize=6');
    expect(style).toContain('metaEdit=1');
    expect(style).toContain('resizable=1');
  });

  it('should format style as semicolon-separated key=value pairs', () => {
    const style = Component.style();
    const parts = style.split(';');
    
    expect(parts.length).toBeGreaterThan(5);
    parts.forEach(part => {
      if (part) {
        expect(part).toMatch(/^[a-zA-Z]+=.+$/);
      }
    });
  });

  it('should have specific Component colors', () => {
    const style = Component.style();
    
    expect(style).toContain('fillColor=#63BEF2');
    expect(style).toContain('strokeColor=#2086C9');
  });

  it('should have smaller arcSize than System and Container', () => {
    const style = Component.style();
    
    expect(style).toContain('arcSize=6');
  });
});