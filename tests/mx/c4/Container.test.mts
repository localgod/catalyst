import { describe, it, expect, vi } from 'vitest';
import { Container } from '../../../src/mx/c4/Container.mjs';

// Mock dependencies
vi.mock('html-entities', () => ({
  encode: vi.fn((str) => `encoded:${str}`)
}));

vi.mock('html-minifier-terser', () => ({
  minify: vi.fn((html) => Promise.resolve(`minified:${html}`))
}));

vi.mock('cheerio', () => ({
  load: vi.fn(() => {
    const mockCheerio = vi.fn((selector: any) => ({
      attr: vi.fn()
    })) as any;
    mockCheerio.html = vi.fn(() => '<div>test</div>');
    return mockCheerio;
  })
}));

describe('Container', () => {
  it('should generate label with proper HTML structure', async () => {
    const label = await Container.label();
    
    expect(label).toContain('encoded:');
    expect(label).toContain('minified:');
  });

  it('should generate style string with correct properties', () => {
    const style = Container.style();
    
    expect(style).toContain('rounded=1');
    expect(style).toContain('whiteSpace=wrap');
    expect(style).toContain('html=1');
    expect(style).toContain('fillColor=#23A2D9');
    expect(style).toContain('fontColor=#ffffff');
    expect(style).toContain('strokeColor=#0E7DAD');
    expect(style).toContain('align=center');
    expect(style).toContain('verticalAlign=top');
    expect(style).toContain('arcSize=10');
    expect(style).toContain('metaEdit=1');
    expect(style).toContain('resizable=1');
  });

  it('should format style as semicolon-separated key=value pairs', () => {
    const style = Container.style();
    const parts = style.split(';');
    
    expect(parts.length).toBeGreaterThan(5);
    parts.forEach(part => {
      if (part) {
        expect(part).toMatch(/^[a-zA-Z]+=.+$/);
      }
    });
  });

  it('should have specific Container colors', () => {
    const style = Container.style();
    
    expect(style).toContain('fillColor=#23A2D9');
    expect(style).toContain('strokeColor=#0E7DAD');
  });

  it('should include fontZize property (typo in original)', () => {
    const style = Container.style();
    
    expect(style).toContain('fontZize=11');
  });
});