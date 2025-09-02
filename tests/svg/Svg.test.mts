import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Svg } from '../../src/svg/Svg.mjs';

// Mock xml2js
vi.mock('xml2js', () => ({
  parseStringPromise: vi.fn()
}));

import { parseStringPromise } from 'xml2js';
const mockParseStringPromise = vi.mocked(parseStringPromise);

describe('Svg', () => {
  let svg: Svg;

  beforeEach(() => {
    svg = new Svg();
    vi.clearAllMocks();
  });

  it('should create Svg instance with default values', () => {
    expect(svg).toBeInstanceOf(Svg);
    expect(svg.svg).toBe('');
    expect(svg.document.svg.$.viewBox).toBe('');
    expect(svg.document.svg.g).toEqual([]);
  });

  it('should load SVG string and parse it', async () => {
    const mockSvgString = '<svg viewBox="0 0 800 600"><g><g id="test"></g></g></svg>';
    const mockParsedDocument = {
      svg: {
        $: { viewBox: '0 0 800 600' },
        g: [{ g: [{ $: { id: 'test' } }] }]
      }
    };

    mockParseStringPromise.mockResolvedValue(mockParsedDocument);

    await svg.load(mockSvgString);

    expect(svg.svg).toBe(mockSvgString);
    expect(svg.document).toEqual(mockParsedDocument);
    expect(mockParseStringPromise).toHaveBeenCalledWith(mockSvgString);
  });

  it('should get document height from viewBox', () => {
    svg.document = {
      svg: {
        $: { viewBox: '0 0 800 600' },
        g: []
      }
    };

    const height = svg.getDocumentHeight();
    expect(height).toBe(600);
  });

  it('should get document width from viewBox', () => {
    svg.document = {
      svg: {
        $: { viewBox: '0 0 800 600' },
        g: []
      }
    };

    const width = svg.getDocumentWidth();
    expect(width).toBe(800);
  });

  it('should handle viewBox with different values', () => {
    svg.document = {
      svg: {
        $: { viewBox: '10 20 1200 900' },
        g: []
      }
    };

    expect(svg.getDocumentWidth()).toBe(1200);
    expect(svg.getDocumentHeight()).toBe(900);
  });

  it('should get groups from document', () => {
    const mockGroups = [
      { $: { id: 'group1' } },
      { $: { id: 'group2' } }
    ];

    svg.document = {
      svg: {
        $: { viewBox: '0 0 800 600' },
        g: [{ g: mockGroups as any }]
      }
    };

    const groups = svg.getGroups();
    expect(groups).toEqual(mockGroups);
  });

  it('should handle empty groups', () => {
    svg.document = {
      svg: {
        $: { viewBox: '0 0 800 600' },
        g: [{ g: [] }]
      }
    };

    const groups = svg.getGroups();
    expect(groups).toEqual([]);
  });

  it('should handle complex SVG structure', async () => {
    const mockSvgString = `
      <svg viewBox="0 0 1000 800">
        <g>
          <g id="elem_system1">
            <rect height="100" width="200" x="50" y="75"/>
            <text>System 1</text>
          </g>
          <g id="link_system1_system2">
            <path d="M100,200 C150,200 200,250 250,300"/>
          </g>
        </g>
      </svg>
    `;

    const mockParsedDocument = {
      svg: {
        $: { viewBox: '0 0 1000 800' },
        g: [{
          g: [
            {
              $: { id: 'elem_system1' },
              rect: [{ $: { height: 100, width: 200, x: 50, y: 75 } }],
              text: [{ $: {} }]
            },
            {
              $: { id: 'link_system1_system2' },
              path: [{ $: { d: 'M100,200 C150,200 200,250 250,300' } }]
            }
          ]
        }]
      }
    };

    mockParseStringPromise.mockResolvedValue(mockParsedDocument);

    await svg.load(mockSvgString);

    expect(svg.getDocumentWidth()).toBe(1000);
    expect(svg.getDocumentHeight()).toBe(800);
    
    const groups = svg.getGroups();
    expect(groups).toHaveLength(2);
    expect(groups[0].$.id).toBe('elem_system1');
    expect(groups[1].$.id).toBe('link_system1_system2');
  });

  it('should handle parsing errors gracefully', async () => {
    const mockSvgString = 'invalid svg';
    const error = new Error('Parsing failed');
    
    mockParseStringPromise.mockRejectedValue(error);

    await expect(svg.load(mockSvgString)).rejects.toThrow('Parsing failed');
  });

  it('should handle viewBox with decimal values', () => {
    svg.document = {
      svg: {
        $: { viewBox: '0 0 800.5 600.7' },
        g: []
      }
    };

    expect(svg.getDocumentWidth()).toBe(800);
    expect(svg.getDocumentHeight()).toBe(600);
  });
});