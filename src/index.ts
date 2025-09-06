// @ts-ignore
import Module from '../build/dfu-util'

interface ModuleType {
    callMain: (args: string[]) => number,
    FS: {
        writeFile: (file: string, data: Uint8Array) => void
    }
}

export default class DFUUtil {
    private onDone?: () => void
    private logs?: string

    constructor(private prefix: string) { }

    getModule(): Promise<ModuleType> {
        return Module({
            locateFile: (file: string) => {
                return this.prefix + file
            },
            print: (text: string) => {
                if (typeof this.onDone === 'undefined' || typeof this.logs === 'undefined') return
                console.log(text)
                this.logs += `${text}\n`

                if (!text.includes('Resetting USB to switch back to Run-Time mode')) return

                this.onDone()
            },
            printErr: (text: string) => {
                if (typeof this.onDone === 'undefined' || typeof this.logs === 'undefined') return
                console.log(text)
                this.logs += `Error: ${text}\n`
            }
        })
    }

    async flash(sketch: Uint8Array) {
        const module = await this.getModule()
        module.FS.writeFile('sketch.bin', sketch)

        return Promise.race([
            new Promise<void>((_resolve, reject) => setTimeout(() => {
                this.logs += "Timeout reached!\n"
                reject(this.logs)
            }, 3 * 60 * 1000)),
            new Promise<void>((resolve) => {
                this.onDone = resolve
                this.logs = ''
                module.callMain(["-D", "/sketch.bin", "-R"])
            })
        ])
    }
}
