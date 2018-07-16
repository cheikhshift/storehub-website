const express = require('express')
var router = express.Router()

var analytic = require("../db/models/analytic")

function aggForDate(set, date, type) {
    var res = 0;
    for (var i = set.length - 1; i >= 0; i--) {
        var a = set[i],
            compDate = (a.date + "").split("00:")[0];

        if (a.type == type && date == compDate) {
            res += a.counter;
        }
    }

    return res;
}

router.post("/stats/:id", (req, res) => {

    var qry = analytic.find({
        $where: `function() {
            return this.date.getTime() > (new Date("${req.body.end}")).getTime() &&
                this.date.getTime() < (new Date("${req.body.start}")).getTime();
        }`,
        product: req.params.id
    });

    qry.exec((err, data) => {
        if (err) {
            res.status(500).send(err)
            return
        }


        var response = { sets: [], labels: [] }

        for (var i = data.length - 1; i >= 0; i--) {
            var a = data[i],
                date = (a.date + "").split("00:")[0];
            if (response.labels.indexOf(date) == -1) {
                response.labels.push(date);
            }
        }

        response.sets.push([])
        response.sets.push([])


        for (var i = response.labels.length - 1; i >= 0; i--) {
            var date = response.labels[i];
            var metricImpression = aggForDate(data, date, 0)
            var metricAction = aggForDate(data, date, 1)
            response.sets[0].push(metricImpression)
            response.sets[1].push(metricAction)

        }

        res.json(response);
    })


})


module.exports = router;