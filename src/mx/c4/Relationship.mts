import { encode } from 'html-entities'
import { minify } from 'html-minifier-terser'
import * as cheerio from 'cheerio';

class Relastionship {
    static async label() {
        const template = `<div><div>%c4Description%</div><div>[%c4Technology%]</div></div>`;
        const $ = cheerio.load(template, {}, false);
        $('div:eq(0)').attr('style', 'text-align: left;')
        $('div:eq(1)').attr('style', 'text-align: center;font-weight:bold;')
        $('div:eq(2)').attr('style', 'text-align: center')
        const minifiedHtml = await minify($.html(), { collapseWhitespace: true });
        return encode(minifiedHtml);
    }

    static style() {
        const styles: Record<string, any> = {
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