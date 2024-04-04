import ILogger from "../logger/ILogger";

export default class TestLogger implements ILogger {
    public readonly logs: any[][] = []
    public readonly errors: any[][] = []

    log(...data: any[]) {
        this.logs.push(data)
    }
    error(...data: any[]) {
        this.errors.push(data)
    }
}
