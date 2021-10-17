const express = require('express') // requiring modules

const mongo = require('./mongo')
const secrets = require('./secrets.json')
const path = require('path')
const nodemailer = require('nodemailer')
const cookieParser = require('cookie-parser')


const { Webhook, MessageBuilder } = require('discord-webhook-node')

let allDiscordHooks = { // define webhooks
    publicsignuphook: new Webhook("https://discord.com/api/webhooks/880802245023772693/WpmSMLfwnyZw2JL2CISwhMA5pmUNpBDrg3eSlkfK-g5Gagajb06cUwE2acV2KWstDktO"),
    privatesignuphook: new Webhook("https://discord.com/api/webhooks/893186034899255328/QI4S91h4VcPBjflzG1HT_ejLDUucbdSTWTHs2W_ooPcq7vZEmBVrkT1-DdwqMmfFkUtv"),
    attemptsignuphook: new Webhook("https://discord.com/api/webhooks/893185700499959830/AMds8pUmb3VaiM0wXSBDmPBV_5iCOm5rERQ0ML1K5d1xfQwuvjfCaD7pFsQRdtDhhC8m"),
    loginhook: new Webhook("https://discord.com/api/webhooks/896685973591715871/DNjzMXYTbfn5O05VDOPQhpDxIgW9wI8V6qDoE2dTIrtdKkIdIrpqgirLSZmX9zBKWfLW"),
    loginattempthook: new Webhook("https://discord.com/api/webhooks/896686161379090462/hNpQC7CI9ru1RjcBvcH1evP3uq8GhZc7s-9jdz0Cmabuy6pVJVzjFq7kQ4aB81T-OhDI")
}


const application = express() // start backend


const accountSchema = require('./schemas/account-schema'); // db schema
const { all } = require('express/lib/application'); // all
const { sign } = require('crypto') // signed cookies


var smtpConfig = { // mail config
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'email@gmail.com',
        pass: secrets.gmailpassword
    }
}

var mailTransporter = nodemailer.createTransport(smtpConfig); // mailer

  
function getCurrentDateString() { // get current date function
    let today = new Date() // get date and time
    let year = today.getFullYear()
    let month = today.getMonth()
    let day = today.getDate()
    let hours = today.getHours()
    let minutes = today.getMinutes()
    let seconds = today.getSeconds()

    if (month < 10) {
        month = `0${month}`
    }
    if (day < 10) {
        day = `0${day}`
    }
    if (hours < 10) {
        hours = `0${hours}`
    }
    if (minutes < 10) {
        minutes = `0${minutes}`
    }
    if (seconds < 10) {
        seconds = `0${seconds}`
    }

    let date = `${day}/${month}/${year} \n${hours}:${minutes}:${seconds}`
    return date // send date and time
}


function randomiseVerificationKey() { // randomise verification key
    let alph = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
    let code = ""
    for (let i = 0; i < 10; i++) { // for 10 char's do
        let strvsint = Math.round(Math.random() * 1 + 1)
        // console.log("strvsint " + strvsint)
        if (strvsint == 1) { // letter
            let pickedletter = alph[Math.round(Math.random() * 25)]  // random letter
            if (Math.round(Math.random() * 1 + 1) == 1) {
                code = code + pickedletter.toUpperCase() // add
            } else {
                code = code + pickedletter.toUpperCase() // add
            }
            // console.log(code)
        } else if (strvsint == 2) { // number
            let pickednumber = Math.round(Math.random() * 9) // random number
            code = code + pickednumber // add
            // console.log(code)
        }
    }
    if (Math.round(Math.random() * 5 + 1) == 1) { // randomise number
        code = code.toUpperCase() // caps
    }
    return code // return verif key
}


// use and set settings for backend
application.set('views', path.join(__dirname, '/public'))
application.set('view engine', 'ejs')

application.use(express.static(__dirname + '/public'))
application.use(express.urlencoded({extended: true}))
application.use(express.json())
application.use(cookieParser('oau932hrWe-=#e3'))



application.get('/', (req, res) => { // home
    const { query } = req 
    const { cookies, signedCookies } = req
    let username = undefined
    if (signedCookies.username) {
        username = signedCookies.username.replace('validLogin', '')
    }
    if (!username) { username = "Sign Up"} // check for login
    res.render('index.ejs', {loggedInUsername: username}) // response
})

application.get('/tos', (req, res) => { // tos
    const { query } = req // check for login
    const { cookies, signedCookies } = req
    let username = undefined
    if (signedCookies.username) {
        username = signedCookies.username.replace('validLogin', '')
    }
    if (!username) { username = "Sign Up"}
    res.render('tos.ejs', {loggedInUsername: username}) // response
})

application.get('/about', (req, res) => { // about
    const { query } = req // check for login
    const { cookies, signedCookies } = req
    let username = undefined
    if (signedCookies.username) {
        username = signedCookies.username.replace('validLogin', '')
    }
    if (!username) { username = "Sign Up"}
    res.render('about.ejs', {loggedInUsername: username}) // response
})

application.get('/login', (req, res) => {
    const { query } = req // check for login
    const { cookies, signedCookies } = req
    let username = undefined
    if (signedCookies.username) {
        username = signedCookies.username.replace('validLogin', '')
    }
    if (!username) { res.render('login.ejs', {loggedInUsername: username}); console.log("login rendered")} else { // response
        res.redirect(`/`) // redirect if logged in
    }
})

application.get('/loggingin', (req, res) => { // loggingin
    console.log("/loggingin")
    const { name, email } = req.query // get query
    console.log(name, email)
    mongo().then(async (mongoose) => { // connect db
        console.log("mongo")
        let data = await accountSchema.findOne({ username: name }) // get data
        if (data.email == email) {
            let verificationcode = randomiseVerificationKey() // randomise key
            await accountSchema.findOneAndUpdate( // update db
                {
                    username: name
                },
                {
                    verifcode: verificationcode
                }
            )
            let mailDetails = { // specify email details
                from: 'helixnonreplyable@gmail.com',
                to: `${email}`,
                subject: 'Helix Login Confirmation',
                text: `Hello there! \n\nTo finish logging in, please go to the following link: https://helixsite2.herokuapp.com/loginconfirmation?name=${name}&email=${email}&code=${verificationcode}.\nIf you're having trouble logging in, please join our discord (https://discord.gg/HYGJKjc) and contact Paige#3198.`
            }
            
            mailTransporter.sendMail(mailDetails, async function(err, data) { // send email, then responding depending on how it went
                let signmessage = undefined
                if(err) { 
                    if (signmessage == undefined) {
                        signmessage = `Failed to send confirmation email, please try again. If this error keeps occuring, please contact Paige#3198 in our discord server: https://discord.gg/HYGJKjc.`
                        res.render('signingup.ejs', {message: signmessage})
                    }
                    console.log("mailtransport failed: " + err)
                } else {
                    console.log('Email sent successfully')
                    if (signmessage == undefined) {
                        signmessage = "Contacted server, Please check your email!"
                        res.render('signingup.ejs', {message: signmessage})
                    }
                    let embed = new MessageBuilder()
                    .setTitle(`${name} just attempted to log in!`)
                    .addField(`Username`, `${name}`, true)
                    .setColor(`#08ff08`)
                    .setFooter(getCurrentDateString())
                    allDiscordHooks.loginattempthook.send(embed)
                }
            })

        }
    })

})

application.get('/loginconfirmation', (req, res) => { // loginconfirmation
    console.log("/loginconfirmation")
    const { name, email, code } = req.query // get query
    console.log(name, email, code)
    mongo().then(async (mongoose) => {
        console.log(mongo)
        let data = await accountSchema.findOne( // get data
            {
                username: name,
                email: email,
                verifcode: code
            }
        )
        console.log(data)
        if (data) { // if data exists 
            console.log("data is true") // log
            accountSchema.findOneAndUpdate( // update db
                {
                    username: name
                },
                {
                    verifcode: "noverifcode"
                }
            )
            res.cookie("username", `validLogin${name}`, {signed: true}) // set cookie
            res.redirect('/') // redirect to home
            let embed = new MessageBuilder() // send log
            .setTitle(`${name} just logged in!`)
            .addField(`Username`, `${name}`, true)
            .setColor(`#08ff08`)
            .setFooter(getCurrentDateString())
            allDiscordHooks.loginhook.send(embed)
            console.log("cookie set and redirected")
        }
    })
})



application.get('/accountlog', (req, res) => { // acountlog
    const { query } = req // check if login
    const { cookies, signedCookies } = req
    let username = undefined
    if (signedCookies.username) {
        username = signedCookies.username.replace('validLogin', '')
    }
    if (!username) { username = "Sign Up"}
    res.render('logup.ejs', {loggedInUsername: username}) // response
})



let port = process.env.PORT || 3000 // listen on 3000 localhost, or custom port if given by hosting
application.listen(port, () =>
    console.log(`listening on port ${port}`) // log
})
