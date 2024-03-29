import assert from 'assert';
import gravityCypressPlugin, {CollectorOptionsWithAuthKey} from "./gravityCypressPlugin";
import { v4 as uuidv4} from 'uuid'
import sinon from 'sinon'
import fetch from "cross-fetch";
import ILogger from "./logger/ILogger";
import {beforeEach} from "mocha";

type AfterSpec = (spec: Cypress.Spec, results: CypressCommandLine.RunResult, f: typeof fetch, logger: ILogger) => void | Promise<void>
describe('gravityCypressPlugin', () => {
    let tasks: Cypress.Tasks
    let afterSpec: AfterSpec
    let mockOn: Cypress.PluginEvents = (key, value) => {
        if (key === 'task') {
            tasks = value as Cypress.Tasks
        }

        if (key === 'after:spec') {
            afterSpec = value as AfterSpec
        }
    }

    const config = {} as Cypress.PluginConfigOptions

    beforeEach(() => {
        tasks = {}
        afterSpec = () => {}
    })

    describe('task: gravity:getCollectorOptions', () => {
        it('returns the collectorOptions provided on setup', () => {
            const collectorOptions: CollectorOptionsWithAuthKey = { authKey: '123-456-789', buildId: "123" }
            gravityCypressPlugin(mockOn, config, collectorOptions)

            assert.deepStrictEqual(
                tasks['gravity:getCollectorOptions'](undefined),
                collectorOptions
            )
        })
    })

    describe('task: gravity:storeCurrentSessionId', () => {
        it('updates the registry for session ids by test', () => {
            gravityCypressPlugin(mockOn, config, {authKey: ''})

            tasks['gravity:storeCurrentSessionId']({sessionId: '123-456', titlePath: ['My spec', 'My first test']})
            const registry = tasks['gravity:storeCurrentSessionId']({sessionId: '456-789', titlePath: ['My spec', 'My second test']})

            assert.deepStrictEqual(
                registry,
                {
                    'My spec/My first test': '123-456',
                    'My spec/My second test': '456-789'
                }
            )
        })
    })

    describe('after:spec', () => {
        const authKey = uuidv4()
        let stubFetch: sinon.SinonStub

        const spec: Cypress.Spec = {
            name: 'My spec',
            absolute: '/home/whatever/cypress/e2e',
            relative: 'e2e'
        }
        const results: CypressCommandLine.RunResult = {
            error: null,
            spec: {...spec, fileExtension: '.cy.ts', fileName: 'mySpec.cy.ts'},
            reporter: 'default',
            tests: [
                {
                    title: ['My spec', 'My first test'],
                    duration: 123,
                    state: 'passed',
                    attempts: [],
                    displayError: null
                },
                {
                    title: ['My spec', 'My second test'],
                    duration: 789,
                    state: 'failed',
                    attempts: [],
                    displayError: null
                }
            ],
            stats: {
                tests: 2,
                passes: 1,
                failures: 1,
                pending: 0,
                skipped: 0,
                suites: 1,
                duration: 123,
                startedAt: '0',
                endedAt: '123',
            },
            video: null,
            reporterStats: {},
            screenshots: []
        }

        let logs: any[][] = []
        let errors: any[][] = []

        const logger: ILogger = {
            log(...data) { logs.push(data) },
            error(...data) { errors.push(data)},
        }


        beforeEach(() => {
            gravityCypressPlugin(mockOn, config, { authKey })
            stubFetch = sinon.stub().returns({json: async () => ({error: null})})
            logs = []
            errors = []
        })

        context('when no session id is found for the test', () => {
            it('does not fetch any data', async () => {
                await afterSpec(spec, results, stubFetch, logger)

                sinon.assert.notCalled(stubFetch)
            })

            it('logs an error for each test which does not have an associated testId', async () => {
                await afterSpec(spec, results, stubFetch, logger)

                assert.deepStrictEqual(errors, [
                    ['No session id found for test: My spec/My first test'],
                    ['No session id found for test: My spec/My second test']
                ])
            })
        })

        context('when sessions ids are recorded for the tests', () => {
            beforeEach(() => {
                tasks['gravity:storeCurrentSessionId']({sessionId: '123-456', titlePath: results.tests[0].title})
                tasks['gravity:storeCurrentSessionId']({sessionId: '456-789', titlePath: results.tests[1].title})
            })

            it('does not log any error', async () => {
                await afterSpec(spec, results, stubFetch, logger)

                assert.deepStrictEqual(errors, [])
            })

            it('identifies each test on Gravity', async () => {
                await afterSpec(spec, results, stubFetch, logger)
                sinon.assert.callCount(stubFetch, 2)

                sinon.assert.calledWith(
                    stubFetch,
                    `https://api.gravity.smartesting.com/api/tracking/${authKey}/session/123-456/identifyTest`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            testName: 'My first test',
                            testPath: 'My spec',
                            testDate: '0',
                            testDuration: 123,
                            testStatus: 'passed',
                            sessionId: '123-456',
                        }),
                    }
                )

                sinon.assert.calledWith(
                    stubFetch,
                    `https://api.gravity.smartesting.com/api/tracking/${authKey}/session/456-789/identifyTest`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            testName: 'My second test',
                            testPath: 'My spec',
                            testDate: '0',
                            testDuration: 789,
                            testStatus: 'failed',
                            sessionId: '456-789',
                        }),
                    }
                )
            })

            it('uses the custom Gravity domain if provided in the collectorConfiguration', async () => {
                gravityCypressPlugin(mockOn, config, { authKey, gravityServerUrl: 'http://localhost:3000' })
                tasks['gravity:storeCurrentSessionId']({sessionId: '123-456', titlePath: results.tests[0].title})
                tasks['gravity:storeCurrentSessionId']({sessionId: '456-789', titlePath: results.tests[1].title})
                await afterSpec(spec, results, stubFetch, logger)

                sinon.assert.callCount(stubFetch, 2)

                sinon.assert.calledWith(
                    stubFetch,
                    `http://localhost:3000/api/tracking/${authKey}/session/123-456/identifyTest`
                )

                sinon.assert.calledWith(
                    stubFetch,
                    `http://localhost:3000/api/tracking/${authKey}/session/456-789/identifyTest`
                )
            })

            it('logs the requests and responses', async () => {
                await afterSpec(spec, results, stubFetch, logger)

                assert.deepStrictEqual(logs, [
                    [{
                        url: `https://api.gravity.smartesting.com/api/tracking/${authKey}/session/123-456/identifyTest`,
                        response: {error: null}
                    }],
                    [{
                        url: `https://api.gravity.smartesting.com/api/tracking/${authKey}/session/456-789/identifyTest`,
                        response: {error: null}
                    }],
                ])
            })
        })
    })
})
