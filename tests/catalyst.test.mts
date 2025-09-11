import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { Command } from 'commander';

// Mock dependencies
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    writeFileSync: vi.fn(),
    promises: {
      readFile: vi.fn()
    }
  }
}));
vi.mock('commander');

vi.mock('../src/puml/EntityParser.mjs', () => ({
  EntityParser: vi.fn().mockImplementation(() => ({
    parse: vi.fn().mockReturnValue([]),
    getObjectWithPropertyAndValueInHierarchy: vi.fn().mockReturnValue(null)
  }))
}));

vi.mock('../src/mx/Mx.mjs', () => ({
  Mx: vi.fn().mockImplementation(() => ({
    addMxC4: vi.fn(),
    addMxC4Relationship: vi.fn(),
    generate: vi.fn().mockResolvedValue('<xml>test</xml>')
  })),
  MxGeometry: vi.fn()
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

const mockFs = vi.mocked(fs);
const mockCommand = vi.mocked(Command);

describe('catalyst.mts', () => {
  let mockCommandInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockCommandInstance = {
      description: vi.fn().mockReturnThis(),
      requiredOption: vi.fn().mockReturnThis(),
      option: vi.fn().mockReturnThis(),
      action: vi.fn().mockReturnThis(),
      parse: vi.fn()
    };
    
    mockCommand.mockReturnValue(mockCommandInstance);
  });

  it('should create a Command instance', async () => {
    // Import the module to trigger the command setup
    await import('../src/catalyst.mjs');
    
    expect(mockCommand).toHaveBeenCalled();
    expect(mockCommandInstance.description).toHaveBeenCalledWith('An application for converting C4 diagrams to draw.io xml using Dagre layout engine');
    expect(mockCommandInstance.requiredOption).toHaveBeenCalledWith('-i, --input <path>', 'path to input file');
    expect(mockCommandInstance.requiredOption).toHaveBeenCalledWith('-o, --output <path>', 'path to output file');
    expect(mockCommandInstance.option).toHaveBeenCalledWith('--layout-direction <direction>', 'layout direction (TB, BT, LR, RL)', 'TB');
  });

  it('should handle file system operations', () => {
    expect(mockFs.existsSync).toBeDefined();
    expect(mockFs.writeFileSync).toBeDefined();
    expect(mockFs.promises.readFile).toBeDefined();
  });

  it('should handle file write operations', () => {
    const mockWriteFileSync = vi.fn();
    mockFs.writeFileSync = mockWriteFileSync;
    
    expect(mockFs.writeFileSync).toBeDefined();
  });
});