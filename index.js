const express = require('express')

const mongo = require('./mongo')
const secrets = require('./secrets.json')
const path = require('path')
const nodemailer = require('nodemailer')
const cookieParser = require('cookie-parser')


const { Webhook, MessageBuilder } = require('discord-webhook-node')

let allDiscordHooks = {
    publicsignuphook: new Webhook("https://discord.com/api/webhooks/880802245023772693/WpmSMLfwnyZw2JL2CISwhMA5pmUNpBDrg3eSlkfK-g5Gagajb06cUwE2acV2KWstDktO"),
    privatesignuphook: new Webhook("https://discord.com/api/webhooks/893186034899255328/QI4S91h4VcPBjflzG1HT_ejLDUucbdSTWTHs2W_ooPcq7vZEmBVrkT1-DdwqMmfFkUtv"),
    attemptsignuphook: new Webhook("https://discord.com/api/webhooks/893185700499959830/AMds8pUmb3VaiM0wXSBDmPBV_5iCOm5rERQ0ML1K5d1xfQwuvjfCaD7pFsQRdtDhhC8m"),
    loginhook: new Webhook("https://discord.com/api/webhooks/896685973591715871/DNjzMXYTbfn5O05VDOPQhpDxIgW9wI8V6qDoE2dTIrtdKkIdIrpqgirLSZmX9zBKWfLW"),
    loginattempthook: new Webhook("https://discord.com/api/webhooks/896686161379090462/hNpQC7CI9ru1RjcBvcH1evP3uq8GhZc7s-9jdz0Cmabuy6pVJVzjFq7kQ4aB81T-OhDI")
}


const application = express()


const accountSchema = require('./schemas/account-schema');
const { all } = require('express/lib/application');
const { sign } = require('crypto')


var smtpConfig = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'helixnonreplyable@gmail.com',
        pass: secrets.gmailpassword
    }
}

var mailTransporter = nodemailer.createTransport(smtpConfig);

  
function getCurrentDateString() {
    let today = new Date()
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
    return date
}


function randomiseVerificationKey() {
    let alph = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
    let code = ""
    for (let i = 0; i < 10; i++) {
        let strvsint = Math.round(Math.random() * 1 + 1)
        // console.log("strvsint " + strvsint)
        if (strvsint == 1) {
            let pickedletter = alph[Math.round(Math.random() * 25)]
            if (Math.round(Math.random() * 1 + 1) == 1) {
                code = code + pickedletter.toUpperCase()
            } else {
                code = code + pickedletter.toUpperCase()
            }
            // console.log(code)
        } else if (strvsint == 2) {
            let pickednumber = Math.round(Math.random() * 9)
            code = code + pickednumber
            // console.log(code)
        }
    }
    if (Math.round(Math.random() * 5 + 1) == 1) {
        code = code.toUpperCase()
    }
    return code
}



application.set('views', path.join(__dirname, '/public'))
application.set('view engine', 'ejs')

application.use(express.static(__dirname + '/public'))
application.use(express.urlencoded({extended: true}))
application.use(express.json())
application.use(cookieParser('oau932hrWe-=#e3'))



application.get('/', (req, res) => {
    const { query } = req
    const { cookies, signedCookies } = req
    let username = undefined
    if (signedCookies.username) {
        username = signedCookies.username.replace('validLogin', '')
    }
    if (!username) { username = "Sign Up"}
    res.render('index.ejs', {loggedInUsername: username})
})

application.get('/tos', (req, res) => {
    const { query } = req
    const { cookies, signedCookies } = req
    let username = undefined
    if (signedCookies.username) {
        username = signedCookies.username.replace('validLogin', '')
    }
    if (!username) { username = "Sign Up"}
    res.render('tos.ejs', {loggedInUsername: username})
})

application.get('/about', (req, res) => {
    const { query } = req
    const { cookies, signedCookies } = req
    let username = undefined
    if (signedCookies.username) {
        username = signedCookies.username.replace('validLogin', '')
    }
    if (!username) { username = "Sign Up"}
    res.render('about.ejs', {loggedInUsername: username})
})

application.get('/login', (req, res) => {
    const { query } = req
    const { cookies, signedCookies } = req
    let username = undefined
    if (signedCookies.username) {
        username = signedCookies.username.replace('validLogin', '')
    }
    if (!username) { res.render('login.ejs', {loggedInUsername: username}); console.log("login rendered")} else {
        res.redirect(`/`)
    }
})

application.get('/loggingin', (req, res) => {
    console.log("/loggingin")
    const { name, email } = req.query
    console.log(name, email)
    mongo().then(async (mongoose) => {
        console.log("mongo")
        let data = await accountSchema.findOne({ username: name })
        if (data.email == email) {
            let verificationcode = randomiseVerificationKey()
            await accountSchema.findOneAndUpdate(
                {
                    username: name
                },
                {
                    verifcode: verificationcode
                }
            )
            let mailDetails = {
                from: 'helixnonreplyable@gmail.com',
                to: `${email}`,
                subject: 'Helix Login Confirmation',
                text: `Hello there! \n\nTo finish logging in, please go to the following link: https://helixsite2.herokuapp.com/loginconfirmation?name=${name}&email=${email}&code=${verificationcode}.\nIf you're having trouble logging in, please join our discord (https://discord.gg/HYGJKjc) and contact Paige#3198.`
            }
            
            mailTransporter.sendMail(mailDetails, async function(err, data) {
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

application.get('/loginconfirmation', (req, res) => {
    console.log("/loginconfirmation")
    const { name, email, code } = req.query
    console.log(name, email, code)
    mongo().then(async (mongoose) => {
        console.log(mongo)
        let data = await accountSchema.findOne(
            {
                username: name,
                email: email,
                verifcode: code
            }
        )
        console.log(data)
        if (data) {
            console.log("data is true")
            accountSchema.findOneAndUpdate(
                {
                    username: name
                },
                {
                    verifcode: "noverifcode"
                }
            )
            res.cookie("username", `validLogin${name}`, {signed: true})
            res.redirect('/')
            let embed = new MessageBuilder()
            .setTitle(`${name} just logged in!`)
            .addField(`Username`, `${name}`, true)
            .setColor(`#08ff08`)
            .setFooter(getCurrentDateString())
            allDiscordHooks.loginhook.send(embed)
            console.log("cookie set and redirected")
        }
    })
})



application.get('/accountlog', (req, res) => {
    const { query } = req
    const { cookies, signedCookies } = req
    let username = undefined
    if (signedCookies.username) {
        username = signedCookies.username.replace('validLogin', '')
    }
    if (!username) { username = "Sign Up"}
    res.render('logup.ejs', {loggedInUsername: username})
})

// application.get('/veryreallogin', (req, res) => {
//     res.cookie("username", `validLogin${req.query.loginUsername}`, {signed: true})
//     res.render('index.ejs', {loggedInUsername: `${req.query.loginUsername}`})
// })

application.get('/helixaccountverification', async (req, res) => {
    console.log("helixaccountverification")
    const { query } = req
    console.log(query)
    const { username, verifcode, email } = query
    mongo().then(async (mongoose) => {
        let data = await accountSchema.findOne({username: username})
        console.log("data")
        console.log(data)
        if (data && data.email == email && data.verifcode == verifcode && data.verifcode != "noverifcode") {
            // res.cookie(`validLogin${data.username}`)
            console.log("yes data is correct!!")
            try {
                await accountSchema.findOneAndUpdate(
                    {username: username},
                    {
                        _id: data._id,
                        username: `${username}`,
                        email: `${email}`,
                        verifcode: "noverifcode",
                        confirmed: true
                    }
                )
                res.render('signingup.ejs', {message: "Your account was succesfully confirmed! We'll notify you when important changes will be made at Helix! \nAlso feel free to join our discord server: https://discord.gg/HYGJKjc"})
                let embed = new MessageBuilder()
                .setTitle(`${username} just signed up!`)
                .addField(`Username`, `${username}`, true)
                .addField(`UserID`, `${data._id}`, true)
                .setColor(`#08ff08`)
                .setFooter(getCurrentDateString())
                allDiscordHooks.publicsignuphook.send(embed)

                let embed2 = new MessageBuilder()
                .setTitle(`${username} just signed up!`)
                .addField(`Username`, `${username}`, true)
                .addField(`UserID`, `${data._id}`, true)
                .addField(`Email`, `${email}`)
                .setColor(`#08ff08`)
                .setFooter(getCurrentDateString())
                allDiscordHooks.privatesignuphook.send(embed2)
                
            } catch(e) {

            }
            // let mailDetails = {
            //     from: 'helixnonreplyable@gmail.com',
            //     to: `${email}`,
            //     subject: 'Helix account verification complete!',
            //     text: `Thank you for verifying your Helix account, we'll notify you for important updates! \n Questions? Join https://discord.gg/HYGJKjc`
            // }
            
            // mailTransporter.sendMail(mailDetails)
        }
    })
})

application.get('/signingup', async (req, res) => {
    let signmessage = undefined
    const { query } = req



    console.log(query)
    if (query.name && query.email) {
        let verificationcode = randomiseVerificationKey()
        let discordverificationcode = randomiseVerificationKey()
        let alreadyExists = {}

        await mongo().then(async (mongoose) => {
            try {
                let allaccounts = await accountSchema.find({}).lean()
                let largestid = 0
                let alreadyexists = {
                    exists: false,
                    val: undefined
                }

                console.log(allaccounts)

                for (let i of allaccounts) {
                    if (i._id > largestid) {
                        largestid = i._id
                    }
                    if (query.name == i.username) {
                        alreadyexists.exists = true
                        alreadyexists.val = "username"
                    }
                    if (query.email == i.email) {
                        alreadyexists.exists = true
                        alreadyexists.val = "email"
                    }
                }
                
                if (alreadyexists.exists == false) {
                    let newuserid = largestid + 1
                    console.log(await accountSchema.findById(1001))
                    console.log(newuserid === 1002)
                    accountSchema.create({
                        _id: newuserid,
                        username: query.name,
                        email: query.email,
                        verifcode: verificationcode,
                        confirmed: false,
                        discordverifcode: discordverificationcode
                    })
                }
                alreadyExists = alreadyexists
    
            } catch(e) {
                console.log(`error: ${e}`)
                signmessage = `Failed to save to database, please try again. If this error keeps occuring, please contact Paige#3198 in our discord server: https://discord.gg/HYGJKjc.`
            }
            if (alreadyExists.exists == false) {
                let mailDetails = {
                    from: 'helixnonreplyable@gmail.com',
                    to: `${query.email}`,
                    subject: 'Helix Account Verification',
                    text: `Hello there! \n\nThanks for signing up at the Helix website! \nYour verification code is ${verificationcode}, this code will expire in 5 minutes. To verify your email, please go to https://helixsite2.herokuapp.com/helixaccountverification?username=${query.name}&verifcode=${verificationcode}&email=${query.email} \n\nYour Helix username is ${query.name} \nIf you would like to join our discord community, press the following link: https://discord.gg/HYGJKjc, your discord verification code is ${discordverificationcode}. \nIf you did NOT request a Helix account, please go to https://helixsite2.herokuapp.com/helixaccountverification?username=${query.name}&email=${query.email} and follow the steps.`
                }

                mailTransporter.sendMail(mailDetails, async function(err, data) {
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
                        let allaccounts = await accountSchema.find({}).lean()
                        let largestid = 0
                        for (let i of allaccounts) {
                            if (i._id > largestid) {
                                largestid = i._id
                            }
                        }
                        let id = largestid + 1
                        let embed = new MessageBuilder()
                        .setTitle(`${query.name} just tried to sign up!`)
                        .addField(`Username`, `${query.name}`, true)
                        .addField(`UserID`, `${id}`, true)
                        .addField(`Email`, `${query.email}`)
                        .setColor(`#08ff08`)
                        .setFooter(getCurrentDateString())
                        allDiscordHooks.attemptsignuphook.send(embed)
                        res.render('signingup.ejs', {message: signmessage})

                    }
                })
                console.log(signmessage)
                if (signmessage == undefined) {
                    signmessage = "Contacted server, Please check your email!"
                    res.render('signingup.ejs', {message: signmessage})
                }
            } else {
                signmessage = `This ${alreadyExists.val} is already taken!`
                res.render('signingup.ejs', {message: signmessage})
                // setTimeout(function() {
                //     res.redirect('localhost:3000/accountlog')
                // }, 5000)
            }

        })



    }
})

application.get('/conndiscord', (req, res) => {
    res.render('connectdiscord.ejs')
})

application.get('/connectingdiscord', (req, res) => {
    const { name, email } = req.query
    mongo().then(async (mongoose) => {
        let data = await accountSchema.findOne({email: email})
        console.log(data)
        let fakedata = await accountSchema.findOne({discordconnection: name})
        if (!fakedata) {
            await accountSchema.findOneAndUpdate(
                {
                    email: email
                },
                {
                    discordconnection: name,
                    discordconnectionstate: "pending"
                }
            )
            console.log(await accountSchema.findOne({email: email}))
            let mailDetails = {
                from: 'helixnonreplyable@gmail.com',
                to: `${email}`,
                subject: 'Helix-Discord Verification',
                text: `Hello there ${data.username}\n\nTo finish your discord verification, please make sure you're in our discord server: https://discord.gg/HYGJKjc \nRun the command "!!scan" in dms to the Helix bot or send it anywhere in the server to verify.`
            }
            
            mailTransporter.sendMail(mailDetails, async function(err, data) {
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
                }
            })
        } else {
            signmessage = "This discord account is already connected to an account, if you did not connect it, please join our discord ( https://discord.gg/HYGJKjc ) and contact Paige#3198."
            res.render('signingup.ejs', {message: signmessage})
        }
    })
})

application.get('/users', (req, res) => {
    let { signedCookies } = req
    if (signedCookies.username) {
        res.send(`wow you're now in the user list this is so cool (logged in as ${signedCookies.username.replace("validLogin", "")})`)
    } else {
        res.send("You must be logged in to view user profiles.")
    }
})

application.get('/users/:id', (req, res) => {
    const { id } = req.params
    if (id == parseInt(id)) {
        let renderingdata = {}
        renderingdata.id = id
        res.render('profile.ejs', renderingdata)
    } else {
        res.send("This profile does not exist, user id's can only consist of numbers.")
    }
    console.log(id)
})



let port = process.env.PORT || 3000
application.listen(port, () => {
    console.log(`listening on port ${port}`)
})