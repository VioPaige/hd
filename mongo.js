const mongoose = require('mongoose')
const mongoPath = "mongodb+srv://Misty:53MxS9gA@helix.qfdmu.mongodb.net/HelixAccounts"


module.exports = async () => {
    await mongoose.connect(mongoPath, {
        // poolSize: 25,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // useFindAndModify: true
    })
    return mongoose
}