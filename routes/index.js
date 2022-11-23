const Main = require("../controllers/Main")

function initRoutes(app, axios) {
    app.get("/", Main().display)
    app.post("/file-uploaded", Main().parseExcel)
}

module.exports = initRoutes;