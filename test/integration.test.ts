import express from "express";
import makeTestRouter from "./utils/testServerRouter";
import assert from 'assert'

import { run } from 'cypress'

type Log = {
    method: string
    url: string,
    body?: object
}

type Stop = () => Promise<void>

describe('Integration test', function () {
    this.timeout(30000)

    let logs: Log[]
    let stops: Stop[]

    beforeEach(async () => {
        logs = []
        stops = [
            await startServer()
        ]
    })

    afterEach(async () => {
        await Promise.all(stops.map(stop => stop()))
    })

    async function runCypressTests() {
        try {
            await run({
                browser: 'electron',
                testingType: 'e2e',

            })
        } catch (err) {
            console.log(err)
        }
    }
    async function startServer(): Promise<Stop> {
        return new Promise<Stop>(resolve => {
            const app = express()
            app.use((req, _res, next) => {
                const log: Log = {
                    url: req.originalUrl,
                    method: req.method
                }

                const contentType = req.headers["content-type"]
                if (contentType && contentType.includes('application/json') && req.body) {
                    try {
                        log.body = JSON.parse(req.body)
                    } catch (err) {
                        console.error('Unable to parse JSON body:', req.body)
                    }

                }
                logs.push(log)
                next()
            })
            app.use(makeTestRouter())
            const server = app.listen('3001', () => {
                console.log('[Test server] Listening on port 3001')
                resolve(async () => {
                    server.close()
                })
            })
        })

    }

    it('properly emits events to Gravity', async () => {
        await runCypressTests()

        const settingsLog = logs.filter(log => log.url.endsWith('/settings'))
        assert.strictEqual(settingsLog.length, 2, 'Settings have been queried by gravity-data-collector for each test')

        const identifyLogs = logs.filter(log => log.url.endsWith('/identifyTest'))
        assert.strictEqual(identifyLogs.length, 2, 'Each test has been identified on Gravity')
    })
})
