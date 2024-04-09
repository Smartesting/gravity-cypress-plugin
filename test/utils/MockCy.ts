import CyLike from "../../src/core/CyLike";
import fetch from "cross-fetch";
import ILogger from "../../src/logger/ILogger";

type GenericCallback = (...args: any[]) => unknown;
type Tasks = { [key: string]: GenericCallback };

type FailListener = (err: Error) => false | void;
type AfterSpec = (
  spec: Cypress.Spec,
  results: CypressCommandLine.RunResult,
) => void | Promise<void>;

export default class MockCy implements CyLike {
  private readonly tasks: Tasks = {};
  private readonly failHandlers: FailListener[] = [];
  private afterSpec: AfterSpec | undefined;
  private readonly eventListeners: { [key: string]: unknown } = {};

  constructor(private readonly win: unknown = null) {}

  public onPlugin: Cypress.PluginEvents = (action, fn) => {
    switch (action) {
      case "task":
        assertIsTasks(fn);
        for (const [key, callback] of Object.entries(fn)) {
          this.tasks[key] = callback;
        }
        return;
      case "after:spec":
        this.afterSpec = fn as AfterSpec;
        return;
    }

    throw new Error(
      `Action ${String(action)} is not handled currently by MockCy`,
    );
  };

  public triggerEvent(event: string, args: unknown[]) {
    if (!Object.keys(this.eventListeners).includes(event)) {
      throw new Error(`No listener recorded for ${event}`);
    }
    const listener = this.eventListeners[event];
    if (!(listener instanceof Function))
      throw new Error(
        `Listener recorded for ${event} is not callable. Got: ${listener}`,
      );
    return listener(...args);
  }

  public triggerAfterSpec(
    spec: Cypress.Spec,
    results: CypressCommandLine.RunResult,
  ) {
    if (!this.afterSpec) throw new Error("after:spec was not set");

    return this.afterSpec(spec, results);
  }

  public on: CyLike["on"] = (event, listener) => {
    const defaultResponse = {} as unknown as Cypress.Cypress & EventEmitter2;
    switch (event) {
      case "fail":
        this.failHandlers.push(<FailListener>listener);
        return defaultResponse;

      default:
        if (typeof event !== "string")
          throw new Error(
            `On string events are handled by MockCY, got: ${String(event)}`,
          );
        this.eventListeners[event] = listener;
        return defaultResponse;
    }
  };

  public task<S = unknown>(taskName: string, arg?: any): Cypress.Chainable<S> {
    const callback = this.tasks[taskName];

    if (!callback) {
      this.fail(
        new Error(
          `CypressError: \`cy.task('${taskName}')\` failed with the following error`,
        ),
      );
      return {
        then: () => {},
      } as unknown as Cypress.Chainable<S>;
    }

    const callbackArgs = callback(arg);
    return {
      then: (c: GenericCallback) => {
        c(callbackArgs);
      },
    } as unknown as Cypress.Chainable<S>;
  }

  public window(): Cypress.Chainable<Cypress.AUTWindow> {
    if (this.win) {
      return {
        then: (callback: GenericCallback) => {
          callback(this.win);
        },
      } as unknown as Cypress.Chainable<Cypress.AUTWindow>;
    }

    throw new Error("MockCy was not initialized with a window");
  }

  private fail(err: Error) {
    for (const failHandler of this.failHandlers) {
      if (!failHandler(err)) return;
    }
    throw err;
  }
}

function assertIsTasks(tbd: unknown): tbd is Tasks {
  return typeof tbd === "object";
}
