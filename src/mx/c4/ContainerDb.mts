class ContainerDb {
    static async label() {
        const html = `<div style="font-size:16px;font-weight:bold;">%c4Name%</div><div>[%c4Type%:%c4Technology%]</div><div style="font-size:11px;color:#cccccc;">%c4Description%</div>`;
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
            shape: 'cylinder3',
            whiteSpace: 'wrap',
            html: 1,
            boundedLbl: 1,
            labelBackgroundColor: 'none',
            fillColor: '#23A2D9',
            fontColor: '#ffffff',
            strokeColor: '#0E7DAD',
            align: 'center',
            verticalAlign: 'top',
            metaEdit: 1,
            resizable: 1,
        }
        return Object.entries(styles).map(([key, value]) => `${key}=${value}`).join(';');
    }
}

export { ContainerDb }
