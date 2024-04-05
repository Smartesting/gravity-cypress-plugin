import TestLogger from "../../test/utils/TestLogger";
import MockCy from "../../test/utils/MockCy";
import setupGravity from "./setupGravity";
import assert from "assert";
import {JSDOM} from "jsdom";
import {CollectorOptionsWithAuthKey} from "./gravityCypressPlugin";
import {v4 as uuidv4} from "uuid";
import sinon from "sinon";
import GravityCollector from "@smartesting/gravity-data-collector/dist";
import waitForAssertion from "../../test/utils/waitForAssertion";

describe('setupGravity', () => {
    let logger: TestLogger
    let mockCy: MockCy

    beforeEach(() => {
        logger = new TestLogger()
        mockCy = new MockCy()
    })

    it('logs an error if task gravity:getCollectorOptions is not defined', () => {
        setupGravity(mockCy, logger)
        assert.deepStrictEqual(logger.errors, [
            ['cy.task("gravity:getCollectorOptions") is not defined. Did you add "gravityCypressPlugin(...)" in your E2E setup']
        ])
    })

    context('when gravityCypressPlugin() has been set up', () => {
        const collectorOptions: CollectorOptionsWithAuthKey = {
            authKey: uuidv4(),
            gravityServerUrl: 'http://localhost:3000'
        }

        let jsDom: JSDOM
        let gravityDataCollectorStub: sinon.SinonStub

        beforeEach(() => {
            jsDom = new JSDOM()
            mockCy = new MockCy(jsDom.window)
            gravityDataCollectorStub = sinon.stub(GravityCollector, 'init').returns()
            mockCy.onPlugin('task', {
                'gravity:getCollectorOptions': () => collectorOptions
            })
        })

        afterEach(() => {
            gravityDataCollectorStub.restore()
        })

        it('installs the collector on the tested application window', () => {
            jsDom.reconfigure({url: 'https://example.com'})
            setupGravity(mockCy, logger)
            sinon.assert.calledWith(gravityDataCollectorStub, {window: jsDom.window, ...collectorOptions})
        })

        it('waits for the window to point to something else than "about:blank" before installing the collector', async () => {
            jsDom.reconfigure({url: "about:blank"})

            setupGravity(mockCy, logger)
            sinon.assert.notCalled(gravityDataCollectorStub)

            jsDom.reconfigure({url: "https://example.com"})

            await waitForAssertion(() => {
                sinon.assert.calledWith(gravityDataCollectorStub, {window: jsDom.window, ...collectorOptions})
            })
        })
    })
})
