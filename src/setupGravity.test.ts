import ILogger from "./logger/ILogger";
import setupGravity from "./setupGravity";
import assert from "assert"
import {CollectorOptionsWithAuthKey} from "./gravityCypressPlugin";
import { v4 as uuidv4} from 'uuid'
import { JSDOM } from 'jsdom'
import sinon from 'sinon'
import * as GravityDataCollector from '@smartesting/gravity-data-collector/dist'
import GravityCollector from "@smartesting/gravity-data-collector/dist";

type GenericCallback = (...args: any[]) => void
describe('setupGravity', () => {
    let errors: any[] = []
    let logger: ILogger = {
        log(...data) {},
        error(...data) {
            errors.push(data)
        }
    }

    beforeEach(() => {
        errors = []
        const eventsCallback: {[key: string]: GenericCallback} = {}

        global.cy = {
            on: (eventName: string, callback: GenericCallback) => {
                eventsCallback[eventName] = callback
            },
            task: (taskName: string, ...args: any[]) => {
                eventsCallback['fail']({message: `Missing task ${taskName}`})
                return {
                    then: (callback: (...args: any[]) => {}) => {},
                }
            }
        }
    })

    it('logs an error if task gravity:getCollectorOptions is not defined', () => {
        setupGravity(logger)
        assert.deepStrictEqual(errors, [
            ['cy.task("gravity:getCollectorOptions") is not defined. Did you add "gravityCypressPlugin(...)" in your E2E setup']
        ])
    })

    context('when gravityCypressPlugin() has been set up', () => {
        const collectorOptions: CollectorOptionsWithAuthKey = {
            authKey: uuidv4(),
            gravityServerUrl: 'http://localhost:3000'
        }
        let window: any
        let gravityDataCollectorStub: sinon.SinonStub

        beforeEach(() => {
            const eventsCallback: {[key: string]: GenericCallback} = {}
            gravityDataCollectorStub = sinon.stub(GravityCollector, 'init').returns()

            global.cy = {
                on: (eventName: string, callback: GenericCallback) => {
                    eventsCallback[eventName] = callback
                },
                task: (taskName: string, ...args: any[]) => {
                    if (taskName === 'gravity:getCollectorOptions') {
                        return {
                            then: (callback: GenericCallback) => {
                                callback(collectorOptions)
                            },
                        }
                    }
                },
                window: () => {
                    return {
                        then: (callback: GenericCallback) => {
                            callback(window)
                        }
                    }
                }
            }
        })

        afterEach(() => {
            gravityDataCollectorStub.restore()
        })

        it('installs the collector on the tested application window', () => {
            const jsdom = new JSDOM('', { url: "https://example.org/" });
            window = jsdom.window

            setupGravity(logger)
            sinon.assert.calledWith(gravityDataCollectorStub, {window, ...collectorOptions})
        })

        it('waits for the window to point to something else than "about:blank" before installing the collector', async () => {
            const jsdom = new JSDOM('', { url: "about:blank" });
            window = jsdom.window

            setupGravity(logger)
            sinon.assert.notCalled(gravityDataCollectorStub)

            jsdom.reconfigure({url: "https://example.com"})

            await waitForAssertion(() => sinon.assert.calledWith(gravityDataCollectorStub, {window, ...collectorOptions}))
        })
    })
})

async function waitForAssertion(assertion: () => void) {
    return new Promise((resolve, reject) => {
        function _wait(waitCount = 0) {
            if (waitCount > 10) {
                return reject('Retried 10 times to get assertion passing')
            }
            try {
                assertion()
                resolve(undefined)
            } catch(err) {
                setTimeout(() => _wait(waitCount + 1), 30)
            }
        }

        _wait()
    })
}
