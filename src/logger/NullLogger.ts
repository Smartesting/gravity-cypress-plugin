import ILogger from "./ILogger";

export default class NullLogger implements ILogger {
  error(...data: any[]): void {}

  log(...data: any[]): void {}
}
