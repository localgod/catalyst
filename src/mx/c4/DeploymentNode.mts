class DeploymentNode {
    static async label() {
        // Deployment nodes show the $type (e.g. "Linux VM", "K8s cluster") in the
        // header, not $technology like Containers do.
        const html = `<div style="font-size:14px;font-weight:bold;">%c4Name%</div><div>[%c4Type%]</div><div style="font-size:11px;color:#666666;">%c4Description%</div>`;
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
            labelBackgroundColor: 'none',
            fillColor: '#FFFFFF',
            strokeColor: '#444444',
            fontColor: '#444444',
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

export { DeploymentNode }
