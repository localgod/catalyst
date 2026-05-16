import { describe, it, expect } from 'vitest';
import { splitLabelLines, htmlBreaks } from '../../src/text/labelLines.mjs';

describe('splitLabelLines', () => {
  it('returns [] for empty / undefined', () => {
    expect(splitLabelLines(undefined)).toEqual([]);
    expect(splitLabelLines('')).toEqual([]);
  });

  it('keeps a single-line string intact', () => {
    expect(splitLabelLines('Admin API')).toEqual(['Admin API']);
  });

  it('splits the PlantUML \\n escape (one backslash + n)', () => {
    expect(splitLabelLines('K8s Secret\\n<workload>-tls'))
      .toEqual(['K8s Secret', '<workload>-tls']);
  });

  it('splits the double-escaped \\\\n form', () => {
    expect(splitLabelLines('a\\\\nb')).toEqual(['a', 'b']);
  });

  it('splits a real newline (defensive)', () => {
    expect(splitLabelLines('a\nb')).toEqual(['a', 'b']);
    expect(splitLabelLines('a\r\nb')).toEqual(['a', 'b']);
  });

  it('preserves an intentionally blank middle line', () => {
    expect(splitLabelLines('a\\n\\nb')).toEqual(['a', '', 'b']);
  });
});

describe('htmlBreaks', () => {
  it('is a no-op when there is no break', () => {
    expect(htmlBreaks('Admin API')).toBe('Admin API');
  });

  it('emits the pre-encoded &lt;br/&gt; token (strict-XML safe)', () => {
    expect(htmlBreaks('a\\nb')).toBe('a&lt;br/&gt;b');
    expect(htmlBreaks('a\\n\\nb')).toBe('a&lt;br/&gt;&lt;br/&gt;b');
  });

  it('does not contain a raw < or > (would break a strict consumer)', () => {
    const out = htmlBreaks('one\\ntwo');
    expect(out).not.toMatch(/<br/);
    expect(out).not.toContain('br/>');
  });
});
