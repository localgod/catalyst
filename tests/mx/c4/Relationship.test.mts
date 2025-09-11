import { describe, it, expect } from 'vitest';
import { Relastionship } from '../../../src/mx/c4/Relationship.mjs';

describe('Relastionship', () => {
  it('should generate label with proper HTML structure', async () => {
    const label = await Relastionship.label();
    
    // Check that HTML is properly encoded
    expect(label).toContain('&lt;div');
    expect(label).toContain('&gt;');
    expect(label).toContain('&quot;');
    
    // Check that placeholders are present
    expect(label).toContain('%c4Description%');
    expect(label).toContain('%c4Technology%');
    
    // Check that styles are applied
    expect(label).toContain('text-align: left;');
    expect(label).toContain('text-align: center;font-weight:bold;');
    expect(label).toContain('text-align: center');
  });

  it('should generate style string with correct properties', () => {
    const style = Relastionship.style();
    
    expect(style).toContain('endArrow=blockThin');
    expect(style).toContain('html=1');
    expect(style).toContain('fontSize=10');
    expect(style).toContain('fontColor=#404040');
    expect(style).toContain('strokeWidth=1');
    expect(style).toContain('strokeColor=#828282');
    expect(style).toContain('endFill=1');
    expect(style).toContain('elbow=vertical');
    expect(style).toContain('metaEdit=1');
    expect(style).toContain('endSize=14');
    expect(style).toContain('startSize=14');
  });

  it('should format style as semicolon-separated key=value pairs', () => {
    const style = Relastionship.style();
    const parts = style.split(';');
    
    expect(parts.length).toBeGreaterThan(10);
    parts.forEach(part => {
      if (part) {
        expect(part).toMatch(/^[a-zA-Z]+=.+$/);
      }
    });
  });

  it('should have relationship-specific styling', () => {
    const style = Relastionship.style();
    
    expect(style).toContain('edgeStyle=orthogonalEdgeStyle');
    expect(style).toContain('jumpStyle=arc');
    expect(style).toContain('jumpSize=16');
    expect(style).toContain('rounded=0');
  });

  it('should have entry point configuration', () => {
    const style = Relastionship.style();
    
    expect(style).toContain('entryX=0.5');
    expect(style).toContain('entryY=1');
    expect(style).toContain('entryDx=0');
    expect(style).toContain('entryDy=0');
  });

  it('should have gray color scheme', () => {
    const style = Relastionship.style();
    
    expect(style).toContain('fontColor=#404040');
    expect(style).toContain('strokeColor=#828282');
  });
});