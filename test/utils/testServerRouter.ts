import express from "express";

export default function makeTestRouter() {
  const router = express.Router();

  router.get("/", express.text(), (_req, res) => {
    res.status(200).send(`
<html>
    <head>
        <title>Simple test app</title>
    </head>
    <script>
      function handleClick() {
          const clickList = document.getElementById('output');
          const item = document.createElement('li')
          item.append('Got clicked')
          clickList.appendChild(item)
      }
    </script>
    <body>
        <button title="Click me" onclick="handleClick()">Click me :)</button>
        <ul id="output">
        
        </ul>
    </body>
</html>
`);
  });

  router.get(
    "/api/tracking/:sessionCollectionAuthKey/settings",
    (_req, res) => {
      res.status(200).json({
        settings: {
          sessionRecording: true,
          videoRecording: true,
          snapshotRecording: true,
          videoAnonymization: true,
        },
        error: null,
      });
    },
  );

  router.post(
    "/api/tracking/:sessionCollectionAuthKey/publish",
    (_req, res) => {
      res.status(201).json({ error: null, jobId: "123" });
    },
  );

  router.post(
    "/api/tracking/:sessionCollectionAuthKey/record/:sessionId",
    (_req, res) => {
      res.status(200).json({ error: null });
    },
  );

  router.post(
    "/api/tracking/:sessionCollectionAuthKey/session/:sessionId/identifyTest",
    (_req, res) => {
      res.status(200).json({ error: null });
    },
  );

  return router;
}
