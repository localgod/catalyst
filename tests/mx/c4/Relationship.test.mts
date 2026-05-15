import { describe, it, expect } from 'vitest';
import { Relastionship } from '../../../src/mx/c4/Relationship.mjs';

describe('Relastionship', () => {
  it('should generate label with proper HTML structure', async () => {
    const label = await Relastionship.label();
    
    // Check that HTML is properly encoded
    expect(label).toContain('&lt;div');
    expect(label).toContain('&gt;');
    expect(label).toContain('&quot;');
    
    // Bold line = the verb (c4Name); second line = technology (c4Technology,
    // pre-bracketed in the value). The verb must NOT be c4Description and the
    // template must NOT hardcode "[...]" (that produced the "[]" tofu box when
    // technology was absent).
    expect(label).toContain('%c4Name%');
    expect(label).toContain('%c4Technology%');
    expect(label).not.toContain('[%c4Technology%]');

    // Check that styles are applied
    expect(label).toContain('text-align: center;font-weight:bold;');
    expect(label).toContain('text-align: center;');
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
    // `elbow` was removed — it only applies to elbowEdgeStyle, a no-op with
    // orthogonalEdgeStyle.
    expect(style).not.toContain('elbow=');
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

  it('must NOT hardcode entry/exit connection points (direction-agnostic routing)', () => {
    const style = Relastionship.style();

    // The old entryY=1 (= "enter the target's bottom") forced a left-side
    // dog-leg with an upward arrowhead for ELK's default top-down layout, and
    // would be wrong for LR/RL/BT layouts too. The orthogonal router must pick
    // the attach side from geometry + ELK waypoints instead.
    expect(style).not.toContain('entryX=');
    expect(style).not.toContain('entryY=');
    expect(style).not.toContain('exitX=');
    expect(style).not.toContain('exitY=');
  });

  it('should have gray color scheme', () => {
    const style = Relastionship.style();
    
    expect(style).toContain('fontColor=#404040');
    expect(style).toContain('strokeColor=#828282');
  });
});