import CyLike from "../core/CyLike";
import MockCy from "../test-utils/MockCy";
import assert from 'assert'
import ILogger from "../logger/ILogger";
import TestLogger from "../test-utils/TestLogger";

export default function ignoreCypressMissingTask(cy: CyLike, taskName: string, logger: ILogger) {
    cy.on("fail", (err) => {
        if (err.message.includes(taskName)) {
            logger.error(`cy.task("${taskName}") is not defined. Did you add "gravityCypressPlugin(...)" in your E2E setup`);
            return false;
        }
        throw err
    });
}
describe('ignoreCypressMissingtask', () => {
    let mockCy: CyLike
    let logger: TestLogger

    beforeEach(() => {
        mockCy = new MockCy()
        logger = new TestLogger()
    })

    it('avoid the test to fail if a task is not defined', () => {
        assert.throws(() => mockCy.task('some:Missing:task'), new Error('Missing task: some:Missing:task'))

        ignoreCypressMissingTask(mockCy, 'some:Missing:task', logger)
        assert.doesNotThrow(() => mockCy.task('some:Missing:task'))
    })

    it('logs the error for traceability', () => {
        ignoreCypressMissingTask(mockCy, 'some:Missing:task', logger)
        mockCy.task('some:Missing:task')

        assert.deepStrictEqual(logger.errors, [
            ['cy.task("some:Missing:task") is not defined. Did you add "gravityCypressPlugin(...)" in your E2E setup']
        ])
    })
})
