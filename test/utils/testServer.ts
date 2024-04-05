import express from 'express'
import makeTestRouter from "./testServerRouter";

const app = express()

app.use(makeTestRouter())

app.use((req, res) => {
    res.status(404).json({
        url: req.originalUrl + ' not found',
    })
})

app.listen('3001', () => console.log("I'm ready to listen!"))

