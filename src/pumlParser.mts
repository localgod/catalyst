type Element = { type: string, alias: string, label: string, description: string }
class PumlParser {
    readonly elementPattern = /(System|Container|Component)\((\w+),\s?"([^"]*)?",\s?"([^"]*)?",\s?"([^"]*)?"/;
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
                // Something wrong... only finds "Container"
                this.elements.push({ type: match[1], alias: match[2], label: match[3], description: match[4] })
            }
        }
        return this.elements;
    }
}

export { PumlParser }