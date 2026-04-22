class Person {
    static async label() {
        const html = `<div style="font-size:16px;font-weight:bold;">%c4Name%</div><div>[%c4Type%]</div><div style="font-size:11px;color:#cccccc;">%c4Description%</div>`;
        const minifiedHtml = html.replace(/>\s+</g, '><');
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
            shape: 'mxgraph.c4.person2',
            align: 'center',
            html: 1,
            labelBackgroundColor: 'none',
            fillColor: '#08427B',
            fontColor: '#ffffff',
            strokeColor: '#073B6F',
            verticalAlign: 'top',
            whiteSpace: 'wrap',
            metaEdit: 1,
            resizable: 1,
        }
        return Object.entries(styles).map(([key, value]) => `${key}=${value}`).join(';');
    }
}

export { Person }
