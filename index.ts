import gravityCypressPluginCore, {CollectorOptionsWithAuthKey} from "./src/core/gravityCypressPlugin";
import ILogger from "./src/logger/ILogger";
export * from "./src/logger/NullLogger";
import setupGravityCore from "./src/core/setupGravity";
import teardownGravityCore from "./src/core/teardownGravity";

export function gravityCypressPlugin(
    on: Cypress.PluginEvents,
    config: Cypress.PluginConfigOptions,
    collectorOptions: CollectorOptionsWithAuthKey
) {
    return gravityCypressPluginCore(on, config, collectorOptions)
}

export function setupGravity(logger: ILogger = console) {
    setupGravityCore(cy, logger)
}

export function teardownGravity(logger: ILogger = console) {
    teardownGravityCore(cy, Cypress, logger)
}
