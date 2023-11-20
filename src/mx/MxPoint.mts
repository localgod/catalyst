class MxPoint {
    $: {
        x: number;
        y: number;
        as?: string;
    }

    constructor(x: number, y: number, as?: string) {
        this.$ = {
            x,
            y
        }
        if (as) {
            this.$.as = as
        }
    }
}

export { MxPoint }
