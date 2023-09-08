type Element = { type: string, alias: string, label: string, description: string }
class PumlParser {
    readonly elementPattern = /(System|Container|Component)\(([^)]*)/;
    private input: string
    private elements: Element[] = []

    constructor(input: string) {
        this.input = input
    }

    parse(): Element[] {
        const lines = this.input.split('\n');
        for (const line of lines) {
            const match = line.match(this.elementPattern);
            if (match) {
                const props = match[2].split(',').map(value => { return value.trim().replaceAll('"', '') })
                if (props.length) {
                    this.elements.push({ type: props[0], alias: props[1], label: props[2], description: props[3] })
                }
            }
        }
        return this.elements;
    }
}

export { PumlParser, Element }