class Relastionship {
    static async label() {
        // Build HTML directly with inline styles
        const html = `<div style="text-align: left;"><div style="text-align: center;font-weight:bold;">%c4Description%</div><div style="text-align: center">[%c4Technology%]</div></div>`;
        
        // Simple whitespace collapse
        const minifiedHtml = html.replace(/>\s+</g, '><');
        
        // Simple HTML entity encoding
        return this.encodeHtmlEntities(minifiedHtml);
    }

    private static encodeHtmlEntities(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    static style() {
        const styles: Record<string, unknown> = {
            endArrow: 'blockThin',
            html: 1,
            fontSize: 10,
            fontColor: '#404040',
            strokeWidth: 1,
            endFill: 1,
            strokeColor: '#828282',
            elbow: 'vertical',
            metaEdit: 1,
            endSize: 14,
            startSize: 14,
            jumpStyle: 'arc',
            jumpSize: 16,
            rounded: 0,
            edgeStyle: 'orthogonalEdgeStyle',
            entryX: 0.5,
            entryY: 1,
            entryDx: 0,
            entryDy: 0,
        }

        return Object.entries(styles).map(([key, value]) => `${key}=${value}`).join(';');
    }
}

export { Relastionship }
