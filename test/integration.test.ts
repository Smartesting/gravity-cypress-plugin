import express from "express";
import makeTestRouter from "./utils/testServerRouter";
import assert from 'assert'

import { run } from 'cypress'
import { AddressInfo } from "net";

type Log = {
    method: string
    url: string,
    body?: object
}

type Stop = () => Promise<void>

describe('Integration test', function () {
    this.timeout(process.env.INTEGRATION_TEST_TIMEOUT ?? 5000)

    let port: number
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
        process.env.TEST_SERVER_PORT = `${port}`

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
        return new Promise<Stop>((resolve, reject) => {
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
            const server = app.listen(0, () => {
                const serverAddress = server.address()
                if (!isAddressInfo(serverAddress)) {
                    return reject(new Error('Express start did not return an address'))
                }
                port = serverAddress.port

                console.log(`[Test server] Listening on port ${port}`)
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

    context('when gravityCypressPlugin is not called in setupNodeEvents', () => {
        it('still run the tests', async () => {
            process.env.DISABLE_GRAVITY_PLUGIN = '1'
            await runCypressTests()

            assert.strictEqual(logs.length, 2)
        })
    })
})

function isAddressInfo(tbd: unknown): tbd is AddressInfo {
    return tbd !== null && typeof tbd === 'object' && (tbd as AddressInfo).port !== undefined
}
