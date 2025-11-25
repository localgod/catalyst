import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies

vi.mock('../src/puml/EntityParser.mjs', () => ({
  EntityParser: class MockEntityParser {
    parse = vi.fn().mockReturnValue([])
    getObjectWithPropertyAndValueInHierarchy = vi.fn().mockReturnValue(null)
  }
}));

vi.mock('../src/mx/Mx.mjs', () => ({
  Mx: class MockMx {
    addMxC4 = vi.fn()
    addMxC4Relationship = vi.fn()
    generate = vi.fn().mockResolvedValue('<xml>test</xml>')
  },
  MxGeometry: class MockMxGeometry {
    constructor(x: number, y: number, width: number, height: number) {}
  }
}));

vi.mock('../src/puml/RelParser.mjs', () => ({
  RelParser: {
    getRelations: vi.fn().mockReturnValue([])
  }
}));

vi.mock('../src/layout/LayoutEngine.mjs', () => ({
  LayoutEngine: {
    calculateLayout: vi.fn().mockResolvedValue({
      nodes: [],
      edges: [],
      clusters: [],
      width: 800,
      height: 600
    })
  }
}));

describe('Catalyst Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export Catalyst class', async () => {
    const { Catalyst } = await import('../src/catalyst.mjs');
    
    expect(Catalyst).toBeDefined();
    expect(typeof Catalyst.convert).toBe('function');
    expect(typeof Catalyst.parseEntities).toBe('function');
    expect(typeof Catalyst.parseRelations).toBe('function');
  });

  it('should convert PlantUML content to draw.io XML', async () => {
    const { Catalyst } = await import('../src/catalyst.mjs');
    
    const pumlContent = `
      @startuml
      !include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml
      System(sys1, "System 1", "Description")
      @enduml
    `;
    
    const result = await Catalyst.convert(pumlContent);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toContain('xml');
  });

  it('should parse entities from PlantUML content', async () => {
    const { Catalyst } = await import('../src/catalyst.mjs');
    
    const pumlContent = `
      @startuml
      System(sys1, "System 1", "Description")
      @enduml
    `;
    
    const entities = Catalyst.parseEntities(pumlContent);
    
    expect(entities).toBeDefined();
    expect(Array.isArray(entities)).toBe(true);
  });

  it('should parse relations from PlantUML content', async () => {
    const { Catalyst } = await import('../src/catalyst.mjs');
    
    const pumlContent = `
      @startuml
      System(sys1, "System 1")
      System(sys2, "System 2")
      Rel(sys1, sys2, "uses")
      @enduml
    `;
    
    const relations = Catalyst.parseRelations(pumlContent);
    
    expect(relations).toBeDefined();
    expect(Array.isArray(relations)).toBe(true);
  });
});