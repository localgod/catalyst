class Boundary {
    static async label() {
        const html = `<div style="font-weight:bold;">%c4Name%</div><div style="font-size:11px;">[%c4Type%]</div>`;
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
            rounded: 0,
            whiteSpace: 'wrap',
            html: 1,
            dashed: 1,
            labelBackgroundColor: 'none',
            strokeColor: '#666666',
            fillColor: 'none',
            fontColor: '#333333',
            align: 'center',
            verticalAlign: 'top',
            fontStyle: 0,
            fontSize: 12,
            metaEdit: 1,
            resizable: 1,
            container: 1,
            collapsible: 0,
        }
        return Object.entries(styles).map(([key, value]) => `${key}=${value}`).join(';');
    }
}

export { Boundary }
