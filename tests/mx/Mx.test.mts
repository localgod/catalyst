import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Mx, MxGeometry } from '../../src/mx/Mx.mjs';

// Mock xml2js
vi.mock('xml2js', () => ({
  default: {
    Builder: class {
      constructor() {}
      buildObject = vi.fn().mockReturnValue('<xml>test</xml>')
    }
  }
}));

// Mock C4 components
vi.mock('../../src/mx/c4/System.mjs', () => ({
  System: {
    label: vi.fn().mockResolvedValue('System Label'),
    style: vi.fn().mockReturnValue('system-style')
  }
}));

vi.mock('../../src/mx/c4/Container.mjs', () => ({
  Container: {
    label: vi.fn().mockResolvedValue('Container Label'),
    style: vi.fn().mockReturnValue('container-style')
  }
}));

vi.mock('../../src/mx/c4/Component.mjs', () => ({
  Component: {
    label: vi.fn().mockResolvedValue('Component Label'),
    style: vi.fn().mockReturnValue('component-style')
  }
}));

vi.mock('../../src/mx/c4/Relationship.mjs', () => ({
  Relastionship: {
    label: vi.fn().mockResolvedValue('Relationship Label'),
    style: vi.fn().mockReturnValue('relationship-style')
  }
}));

describe('Mx', () => {
  let mx: Mx;
  let geometry: MxGeometry;

  beforeEach(() => {
    mx = new Mx(800, 600);
    geometry = new MxGeometry(100, 200, 50, 75);
  });

  it('should create Mx instance with correct dimensions', () => {
    expect(mx).toBeInstanceOf(Mx);
    expect(mx.doc.MxFile.diagram.MxGraphModel.$?.pageHeight).toBe(800);
    expect(mx.doc.MxFile.diagram.MxGraphModel.$?.pageWidth).toBe(600);
  });

  it('should initialize with default MxCells', () => {
    const cells = mx.doc.MxFile.diagram.MxGraphModel.root.MxCell;
    expect(cells).toHaveLength(2);
    expect(cells?.[0].$.id).toBe('0');
    expect(cells?.[1].$.id).toBe('1');
    expect(cells?.[1].$.parent).toBe('0');
  });

  it('should add System C4 element', async () => {
    await mx.addMxC4('test-system', geometry, 'System', 'Test System', 'Java', 'A test system');
    
    const objects = mx.doc.MxFile.diagram.MxGraphModel.root.object;
    expect(objects).toHaveLength(1);
    expect((objects?.[0] as any)?.$.c4Type).toBe('System');
    expect((objects?.[0] as any)?.$.c4Name).toBe('Test System');
    expect((objects?.[0] as any)?.$.id).toBe('test-system');
  });

  it('should add Container C4 element', async () => {
    await mx.addMxC4('test-container', geometry, 'Container', 'Test Container', 'Spring Boot', 'A test container');
    
    const objects = mx.doc.MxFile.diagram.MxGraphModel.root.object;
    expect(objects).toHaveLength(1);
    expect((objects?.[0] as any)?.$.c4Type).toBe('Container');
    expect((objects?.[0] as any)?.$.c4Name).toBe('Test Container');
  });

  it('should add Component C4 element', async () => {
    await mx.addMxC4('test-component', geometry, 'Component', 'Test Component', 'React', 'A test component');
    
    const objects = mx.doc.MxFile.diagram.MxGraphModel.root.object;
    expect(objects).toHaveLength(1);
    expect((objects?.[0] as any)?.$.c4Type).toBe('Component');
    expect((objects?.[0] as any)?.$.c4Name).toBe('Test Component');
  });

  it('should add C4 relationship', async () => {
    await mx.addMxC4Relationship(geometry, 'source-id', 'target-id', 'Relationship', 'Uses', 'HTTP', 'API calls');
    
    const objects = mx.doc.MxFile.diagram.MxGraphModel.root.object;
    expect(objects).toHaveLength(1);
    expect((objects?.[0] as any)?.$.c4Type).toBe('Relationship');
    expect((objects?.[0] as any)?.$.c4Name).toBe('Uses');
    expect((objects?.[0] as any)?.MxCell.$.source).toBe('source-id');
    expect((objects?.[0] as any)?.MxCell.$.target).toBe('target-id');
  });

  it('should replace keys with values', () => {
    const records = [
      { 'oldKey': 'newValue' },
      { 'anotherKey': 'anotherValue' }
    ];
    const input = 'This has oldKey and anotherKey in it';
    const result = mx.replaceKeysWithValue(records, input);
    
    expect(result).toBe('This has newValue and anotherValue in it');
  });

  it('should generate XML output', async () => {
    await mx.addMxC4('test', geometry, 'System', 'Test System');
    const result = await mx.generate();
    
    expect(result).toContain('<xml>test</xml>');
  });

  it('should handle unknown C4 type gracefully', async () => {
    await mx.addMxC4('test', geometry, 'Unknown', 'Test Unknown');
    
    const objects = mx.doc.MxFile.diagram.MxGraphModel.root.object;
    expect(objects).toHaveLength(1);
    expect((objects?.[0] as any)?.$.c4Type).toBe('');
  });
});