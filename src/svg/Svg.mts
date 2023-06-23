import xml2js from 'xml2js'

class Svg {
    svg: string
    document: { svg: { $: { viewBox: string }, g: { g: [] }[] } }

    async load(svg: string): Promise<void> {
        this.svg = svg
        this.document = await xml2js.parseStringPromise(this.svg)
    }

    getDocumentHeight(): number {
        return parseInt(this.document.svg.$.viewBox.split(' ')[3])
    }

    getDocumentWidth(): number {
        return parseInt(this.document.svg.$.viewBox.split(' ')[2])
    }

    getElements(): { $: { id: string }, text?: {}[], rect?: {} }[] {
        return this.document.svg.g[0].g
    }
}
export { Svg }