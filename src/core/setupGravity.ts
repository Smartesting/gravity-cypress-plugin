import ILogger from "../logger/ILogger";
import CyLike from "./CyLike";
import GravityCollector from "@smartesting/gravity-data-collector/dist";
import { CollectorOptions } from "@smartesting/gravity-data-collector";
import { v4 as uuidv4 } from "uuid";

export default function setupGravity(cy: CyLike, logger: ILogger) {
  const sessionId = uuidv4();
  return cy.task("gravity:getCollectorOptions").then((collectorOptions) => {
    if (!isPartialCollectorOptions(collectorOptions)) return;

    return cy.on("window:before:load", (win) => {
      installGravityCollector(win, collectorOptions, sessionId);
    });
  });
}

function installGravityCollector(
  win: Cypress.AUTWindow,
  collectorOptions: Partial<CollectorOptions>,
  sessionId: string,
) {
  function waitForPageToLoad(collectorOptions: Partial<CollectorOptions>) {
    const url = win.document.URL;

    if (url === undefined || url.startsWith("about:")) {
      setTimeout(() => waitForPageToLoad(collectorOptions), 5);
    } else {
      GravityCollector.initWithOverride(
        {
          window: win,
          ...collectorOptions,
        },
        sessionId,
      );
    }
  }

  waitForPageToLoad(collectorOptions);
}

function isPartialCollectorOptions(
  toBeDetermined: unknown,
): toBeDetermined is Partial<CollectorOptions> {
  return (
    toBeDetermined !== undefined &&
    typeof toBeDetermined === "object" &&
    (toBeDetermined as CollectorOptions).authKey !== undefined
  );
}
