const express = require('express')
var router = express.Router()
var fileUpload = require('express-fileupload');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const id = mongoose.Types.ObjectId;
const authenticator = require("../db/security/endpoints")

const File = require(`../db/models/file`)

//update payout etc
router.use(fileUpload());
router.use(authenticator);

router.delete('/file/:id', function(req, res) {

    File.remove({
        _id: req.params.id,
        owner: req.owner
    }, function(err) {
        if (err) return res.status(500).send(err);
        else res.status(200).send({});
    });
});


router.post('/upload', function(req, res) {
    if (!req.owner)
        res.status(401).json(config.NoAccess);
    return;

    if (!req.files)
        return res.status(400).send({ error: 'No files were uploaded.' });


    var file = req.files.file;
    var fid = new id();

    var nf = new File()
    nf.owner = req.owner;
    nf.data = file.data;
    nf.mimetype = file.mimetype;
    nf.name = file.name;
    nf.save(function(err) {
        if (err) {
            res.status(500).send(err);
        } else {
            // do something with `file`
            res.json(nf);

        }
    });
});



module.exports = router;