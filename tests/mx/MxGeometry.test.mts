import { describe, it, expect } from 'vitest';
import { MxGeometry } from '../../src/mx/MxGeometry.mjs';
import { MxPoint } from '../../src/mx/MxPoint.mjs';

describe('MxGeometry', () => {
  it('should create MxGeometry with all parameters', () => {
    const geometry = new MxGeometry(100, 200, 50, 75);
    
    expect(geometry.$.height).toBe(100);
    expect(geometry.$.width).toBe(200);
    expect(geometry.$.x).toBe(50);
    expect(geometry.$.y).toBe(75);
    expect(geometry.$.as).toBe('geometry');
  });

  it('should create MxGeometry with partial parameters', () => {
    const geometry = new MxGeometry(100, 200);
    
    expect(geometry.$.height).toBe(100);
    expect(geometry.$.width).toBe(200);
    expect(geometry.$.x).toBeUndefined();
    expect(geometry.$.y).toBeUndefined();
    expect(geometry.$.as).toBe('geometry');
  });

  it('should create MxGeometry with no parameters', () => {
    const geometry = new MxGeometry();
    
    expect(geometry.$.height).toBeUndefined();
    expect(geometry.$.width).toBeUndefined();
    expect(geometry.$.x).toBeUndefined();
    expect(geometry.$.y).toBeUndefined();
    expect(geometry.$.as).toBe('geometry');
  });

  it('should floor decimal values', () => {
    const geometry = new MxGeometry(100.7, 200.9, 50.3, 75.8);
    
    expect(geometry.$.height).toBe(100);
    expect(geometry.$.width).toBe(200);
    expect(geometry.$.x).toBe(50);
    expect(geometry.$.y).toBe(75);
  });

  it('should add point to mxPoint array', () => {
    const geometry = new MxGeometry();
    const point = new MxPoint(10, 20);
    
    geometry.addPoint(point);
    
    // @ts-expect-error Testing dynamic property
    expect(geometry.mxPoint).toHaveLength(1);
    // @ts-expect-error Testing dynamic property
    expect(geometry.mxPoint[0]).toBe(point);
  });

  it('should add multiple points to mxPoint array', () => {
    const geometry = new MxGeometry();
    const point1 = new MxPoint(10, 20);
    const point2 = new MxPoint(30, 40);
    
    geometry.addPoint(point1);
    geometry.addPoint(point2);
    
    // @ts-expect-error Testing dynamic property
    expect(geometry.mxPoint).toHaveLength(2);
    // @ts-expect-error Testing dynamic property
    expect(geometry.mxPoint[0]).toBe(point1);
    // @ts-expect-error Testing dynamic property
    expect(geometry.mxPoint[1]).toBe(point2);
  });

  it('should add point to Array.mxPoint', () => {
    const geometry = new MxGeometry();
    const point = new MxPoint(10, 20);
    
    geometry.addArrayPoint(point);
    
    // @ts-expect-error Testing dynamic property
    expect(geometry.Array.$.as).toBe('points');
    // @ts-expect-error Testing dynamic property
    expect(geometry.Array.mxPoint).toHaveLength(1);
    // @ts-expect-error Testing dynamic property
    expect(geometry.Array.mxPoint[0]).toBe(point);
  });

  it('should add multiple points to Array.mxPoint', () => {
    const geometry = new MxGeometry();
    const point1 = new MxPoint(10, 20);
    const point2 = new MxPoint(30, 40);
    
    geometry.addArrayPoint(point1);
    geometry.addArrayPoint(point2);
    
    // @ts-expect-error Testing dynamic property
    expect(geometry.Array.mxPoint).toHaveLength(2);
    // @ts-expect-error Testing dynamic property
    expect(geometry.Array.mxPoint[0]).toBe(point1);
    // @ts-expect-error Testing dynamic property
    expect(geometry.Array.mxPoint[1]).toBe(point2);
  });
});