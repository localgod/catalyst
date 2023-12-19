import { parseStringPromise } from 'xml2js'


interface rect {
    $: {
        height?: number
        width?: number
    }
}

interface text {
    $: {}
}

interface path {
    $: {
        d:string
    }
}

interface g {
    $: {
        id:string
    }
    rect?: rect[]
    text?:text[]
    path?:path
}

class Svg {
    svg: string
    document: { svg: { $: { viewBox: string }, g: { g: [] }[] } }

    async load(svg: string): Promise<void> {
        this.svg = svg
        this.document = await parseStringPromise(this.svg)
    }

    getDocumentHeight(): number {
        return parseInt(this.document.svg.$.viewBox.split(' ')[3])
    }

    getDocumentWidth(): number {
        return parseInt(this.document.svg.$.viewBox.split(' ')[2])
    }

    getGroups(): g[] {
        return this.document.svg.g[0].g
    }
}

export { rect, text, path, g, Svg }
