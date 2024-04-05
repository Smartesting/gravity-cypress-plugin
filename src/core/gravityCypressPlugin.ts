import cFetch from "cross-fetch";
import {CollectorOptions} from "@smartesting/gravity-data-collector";
import ILogger from "../logger/ILogger";

export type CollectorOptionsWithAuthKey = Partial<CollectorOptions> & { authKey: string }

export default function gravityCypressPlugin(
    on: Cypress.PluginEvents,
    _config: Cypress.PluginConfigOptions,
    collectorOptions: CollectorOptionsWithAuthKey,
    logger: ILogger = console,
    fetch = cFetch
) {
    const sessionIdByTest: Record<string, string> = {};

    on("task", {
        "gravity:getCollectorOptions": () => {
            return collectorOptions;
        },
        "gravity:storeCurrentSessionId": ({
                                              sessionId,
                                              titlePath,
                                          }: {
            sessionId: string;
            titlePath: string[];
        }) => {
            sessionIdByTest[titlePath.join("/")] = sessionId;
            return sessionIdByTest;
        }
    })

    on("after:spec", async (_spec, results) => {
        const gravityServerUrl = collectorOptions.gravityServerUrl ?? 'https://api.gravity.smartesting.com'

        for (const test of results.tests) {
            const testTitle = test.title.join("/")
            const sessionId = sessionIdByTest[testTitle]

            if (sessionId) {
                const url = `${gravityServerUrl}/api/tracking/${collectorOptions.authKey}/session/${sessionId}/identifyTest`
                const response = await fetch(
                    url,
                    {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({
                            testName: test.title.slice(-1)[0],
                            testPath: test.title.slice(0, -1).join(" / "),
                            testDate: results.stats.startedAt,
                            testDuration: test.duration,
                            testStatus: test.state,
                            sessionId,
                        }),
                    }
                )
                logger.log({
                    url,
                    response: await response.json()
                })
            } else {
                logger.error(`No session id found for test: ${testTitle}`);
            }
        }
    })
}
