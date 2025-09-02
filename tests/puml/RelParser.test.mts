import { describe, it, expect } from 'vitest';
import { RelParser } from '../../src/puml/RelParser.mjs';

describe('RelParser', () => {
  it('should create RelParser instance', () => {
    const rel = { $: { id: 'link_source_target' } };
    const parser = new RelParser(rel);
    
    expect(parser).toBeInstanceOf(RelParser);
  });

  it('should parse relations from PUML string', () => {
    const pumlString = `
      System(system1, "System 1")
      System(system2, "System 2")
      Rel(system1, system2, "Uses", "HTTP API")
      Rel(system2, system1, "Responds", "JSON data")
    `;
    
    const relations = RelParser.getRelations(pumlString);
    
    expect(relations).toHaveLength(2);
    expect(relations[0]).toEqual({
      source: 'system1',
      target: 'system2',
      label: 'Uses',
      description: 'HTTP API'
    });
    expect(relations[1]).toEqual({
      source: 'system2',
      target: 'system1',
      label: 'Responds',
      description: 'JSON data'
    });
  });

  it('should return empty array when no relations found', () => {
    const pumlString = `
      System(system1, "System 1")
      System(system2, "System 2")
    `;
    
    const relations = RelParser.getRelations(pumlString);
    
    expect(relations).toHaveLength(0);
  });

  it('should parse path coordinates from SVG path', () => {
    const rel = {
      path: [{
        $: {
          d: 'M100,200 C150,200 200,250 250,300'
        }
      }]
    };
    const parser = new RelParser(rel);
    
    const coordinates = parser.parsePathCoordinates(rel.path[0].$.d);
    
    expect(coordinates).toEqual({
      start: { x: 100, y: 200 },
      end: { x: 250, y: 300 }
    });
  });

  it('should return null for invalid path coordinates', () => {
    const rel = {};
    const parser = new RelParser(rel);
    
    const coordinates = parser.parsePathCoordinates('invalid path');
    
    expect(coordinates).toBeNull();
  });

  it('should get geometry with source and target points', () => {
    const rel = {
      path: [{
        $: {
          d: 'M100,200 C150,200 200,250 250,300'
        }
      }]
    };
    const parser = new RelParser(rel);
    
    const geometry = parser.getpath();
    
    // @ts-expect-error Testing dynamic property
    expect(geometry.mxPoint).toHaveLength(2);
    // @ts-expect-error Testing dynamic property
    expect(geometry.mxPoint[0].$.x).toBe(100);
    // @ts-expect-error Testing dynamic property
    expect(geometry.mxPoint[0].$.y).toBe(200);
    // @ts-expect-error Testing dynamic property
    expect(geometry.mxPoint[0].$.as).toBe('sourcePoint');
    // @ts-expect-error Testing dynamic property
    expect(geometry.mxPoint[1].$.x).toBe(250);
    // @ts-expect-error Testing dynamic property
    expect(geometry.mxPoint[1].$.y).toBe(300);
    // @ts-expect-error Testing dynamic property
    expect(geometry.mxPoint[1].$.as).toBe('targetPoint');
  });

  it('should get geometry without points when no path', () => {
    const rel = {};
    const parser = new RelParser(rel);
    
    const geometry = parser.getpath();
    
    // @ts-expect-error Testing dynamic property
    expect(geometry.mxPoint).toBeUndefined();
  });

  it('should get from and to from relation ID', () => {
    const rel = { $: { id: 'link_source_target' } };
    const parser = new RelParser(rel);
    
    expect(parser.getFrom()).toBe('source');
    expect(parser.getTo()).toBe('target');
  });

  it('should handle complex relation IDs', () => {
    const rel = { $: { id: 'link_system1_container2' } };
    const parser = new RelParser(rel);
    
    expect(parser.getFrom()).toBe('system1');
    expect(parser.getTo()).toBe('container2');
  });

  it('should return empty array when no ID present', () => {
    const rel = {};
    const parser = new RelParser(rel);
    
    expect(parser.getFrom()).toBeUndefined();
    expect(parser.getTo()).toBeUndefined();
  });

  it('should handle malformed relation ID', () => {
    const rel = { $: { id: 'invalid_format' } };
    const parser = new RelParser(rel);
    
    expect(parser.getFrom()).toBe('invalid');
    expect(parser.getTo()).toBe('format');
  });

  it('should parse decimal coordinates', () => {
    const rel = {};
    const parser = new RelParser(rel);
    
    const coordinates = parser.parsePathCoordinates('M100.5,200.7 C150.2,200.3 200.8,250.1 250.9,300.4');
    
    expect(coordinates).toEqual({
      start: { x: 100.5, y: 200.7 },
      end: { x: 250.9, y: 300.4 }
    });
  });

  it('should parse negative coordinates', () => {
    const rel = {};
    const parser = new RelParser(rel);
    
    const coordinates = parser.parsePathCoordinates('M-100,-200 C-150,-200 -200,-250 -250,-300');
    
    expect(coordinates).toEqual({
      start: { x: -100, y: -200 },
      end: { x: -250, y: -300 }
    });
  });
});