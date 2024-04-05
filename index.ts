import gravityCypressPluginCore, {CollectorOptionsWithAuthKey} from "./src/core/gravityCypressPlugin";
import ILogger from "./src/logger/ILogger";
import NullLogger from "./src/logger/NullLogger";
import setupGravityCore from "./src/core/setupGravity";
import teardownGravityCore from "./src/core/teardownGravity";
import fetch from 'cross-fetch'

export function gravityCypressPlugin(
    on: Cypress.PluginEvents,
    config: Cypress.PluginConfigOptions,
    collectorOptions: CollectorOptionsWithAuthKey
) {
    return gravityCypressPluginCore(on, config, collectorOptions, new NullLogger(), fetch)
}

export function setupGravity(logger: ILogger = new NullLogger()) {
    setupGravityCore(cy, logger)
}

export function teardownGravity(logger: ILogger = new NullLogger()) {
    teardownGravityCore(cy, Cypress, logger)
}
