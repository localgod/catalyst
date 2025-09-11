class Container {
    static async label() {
        // Build HTML directly with inline styles
        const html = `<div style="font-size:16px;font-weight:bold;">%c4Name%</div><div>[%c4Type%:%c4Technology%]</div><div style="font-size:11px;color:#cccccc;">%c4Description%</div>`;
        
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
            rounded: 1,
            whiteSpace: 'wrap',
            html: 1,
            fontZize: 11,
            labelBackgroundColor: 'none',
            fillColor: '#23A2D9',
            fontColor: '#ffffff',
            align: 'center',
            verticalAlign:'top',
            arcSize: 10,
            strokeColor: '#0E7DAD',
            metaEdit: 1,
            resizable: 1
        }

        return Object.entries(styles).map(([key, value]) => `${key}=${value}`).join(';');
    }
}

export { Container }
