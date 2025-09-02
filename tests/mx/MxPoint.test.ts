import { describe, it, expect } from 'vitest';
import { MxPoint } from '../../src/mx/MxPoint.mjs';

describe('MxPoint', () => {
  it('should create MxPoint with x and y coordinates', () => {
    const point = new MxPoint(10, 20);
    
    expect(point.$.x).toBe(10);
    expect(point.$.y).toBe(20);
    expect(point.$.as).toBeUndefined();
  });

  it('should create MxPoint with x, y, and as parameters', () => {
    const point = new MxPoint(15, 25, 'sourcePoint');
    
    expect(point.$.x).toBe(15);
    expect(point.$.y).toBe(25);
    expect(point.$.as).toBe('sourcePoint');
  });

  it('should handle negative coordinates', () => {
    const point = new MxPoint(-10, -20);
    
    expect(point.$.x).toBe(-10);
    expect(point.$.y).toBe(-20);
  });

  it('should handle zero coordinates', () => {
    const point = new MxPoint(0, 0);
    
    expect(point.$.x).toBe(0);
    expect(point.$.y).toBe(0);
  });

  it('should handle decimal coordinates', () => {
    const point = new MxPoint(10.5, 20.7);
    
    expect(point.$.x).toBe(10.5);
    expect(point.$.y).toBe(20.7);
  });

  it('should not set as property with empty string', () => {
    const point = new MxPoint(10, 20, '');
    
    expect(point.$.x).toBe(10);
    expect(point.$.y).toBe(20);
    expect(point.$.as).toBeUndefined();
  });

  it('should not set as property when not provided', () => {
    const point = new MxPoint(10, 20);
    
    expect(point.$.as).toBeUndefined();
  });
});