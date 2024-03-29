export default interface ILogger {
    log(...data: any[]): void
    error(...data: any[]): void
}
