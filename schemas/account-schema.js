const mongoose = require('mongoose')


const accountSchema = mongoose.Schema({
    _id: {type: Number, required: true},
    username: {type: String, required: true},
    email: {type: String, required: true},
    verifcode: {type: String, required: false},
    confirmed: {type: Boolean, required: true},
    admin: {type: Boolean, required: false}
})



module.exports = mongoose.model('AccountData', accountSchema, 'AccountData')