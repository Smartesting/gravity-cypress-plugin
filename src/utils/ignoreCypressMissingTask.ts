import CyLike from "../core/CyLike";
import ILogger from "../logger/ILogger";

export default function ignoreCypressMissingTask(cy: CyLike, taskName: string, logger: ILogger) {
    cy.on("fail", (err) => {
        if (err.message.includes(taskName)) {
            logger.error(`cy.task("${taskName}") is not defined. Did you add "gravityCypressPlugin(...)" in your E2E setup`);
            return false;
        }
        throw err
    });
}
