const jwt = require('jsonwebtoken');

const configd = require("configd");
const JWTKey = configd.JWTKey;

const NoAccess = { "error": "unauthorized request." };


var appPermissions = [{
        id: "gm",
        collection: "locations"
    },
    {
        id: "cme",
        collection: "products"
    },
    {
        id: "re",
        collection: "events"
    },
    {
        id: "spl",
        collection: "images"
    }
];

var CheckAppPermission = (req) => {
    var apps = req.session.apps;
    for (var i = appPermissions.length - 1; i >= 0; i--) {
        var app = appPermissions[i];


        if (req.originalUrl.includes(app.collection) && apps.indexOf(app.id) == -1) {
            return false;
        }
    }
    return true;
}

var VerifyRequest = (req) => {


    if (req.method == "OPTIONS") {
        delete req.body;
        delete req.query;
        return true;
    }

    var jwttoken = req.header("token");

    if (req.session && req.session.token) {
        jwttoken = req.session.token;
    }

    try {
        var decoded = jwt.verify(jwttoken, JWTKey);

        if (!decoded.userid)
            return false;

        req.owner = decoded.userid;

        return true;

    } catch (err) {
        // err
        console.log(err);
        return false;
    }

}

var Authenticator = (req, res, next) => {

    if (VerifyRequest(req)) {
        if (CheckAppPermission(req)) {
            next() // pass control to the next handler
            return;
        }

        res.status(401).json({ "error": "unauthorized to use app." })
    } else {

        res.status(401).json(NoAccess);
    }
}

module.exports = Authenticator;