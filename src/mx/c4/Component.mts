import { encode } from 'html-entities'
import { minify } from 'html-minifier-terser'
import * as cheerio from 'cheerio';

class Component {
    static async label() {
        const template = `<div>%c4Name%</div><div>[%c4Type%:%c4Technology%]</div><div>%c4Description%</div>`;
        const $ = cheerio.load(template, {}, false);
        $('div:eq(0)').attr('style', 'font-size:16px;font-weight:bold;')
        $('div:eq(2)').attr('style', 'font-size:11px;color:#cccccc;')
        const minifiedHtml = await minify($.html(), { collapseWhitespace: true });
        return encode(minifiedHtml);
    }

    static style() {
        const styles: Record<string, unknown> = {
            rounded: 1,
            whiteSpace: 'wrap',
            html: 1,
            labelBackgroundColor: 'none',
            fillColor: '#63BEF2',
            fontColor: '#ffffff',
            align: 'center',
            verticalAlign:'top',
            arcSize: 6,
            strokeColor: '#2086C9',
            metaEdit: 1,
            resizable: 1
        }

        return Object.entries(styles).map(([key, value]) => `${key}=${value}`).join(';');
    }
}

export { Component }
