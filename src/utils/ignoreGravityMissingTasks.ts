import CyLike from "../core/CyLike";
import ILogger from "../logger/ILogger";

export default function ignoreGravityMissingTasks(cy: CyLike, logger: ILogger) {
  cy.on("fail", (err) => {
    const match = new RegExp(
      /`cy.task\('(gravity:.*)'\)` failed with the following error/,
    ).exec(err.message);
    if (match) {
      logger.error(
        `cy.task("${match[1]}") is not defined. Did you add "gravityCypressPlugin(...)" in your E2E setup`,
      );
      return false;
    }

    throw err;
  });
}
