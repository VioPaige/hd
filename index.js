const express = require('express')
const mongo = require('./mongo')
const path = require('path')
const nodemailer = require('nodemailer');

const application = express()


const accountSchema = require('./schemas/account-schema');
const { all } = require('express/lib/application');


let mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'madmistyy@gmail.com',
        pass: '53MxS9gA'
    }
})


  




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



application.get('/', (req, res) => {
    res.render('index.ejs')
})

application.get('/about', (req, res) => {
    res.render('about.ejs')
})

application.get('/accountlog', (req, res) => {
    res.render('logup.ejs')
})

application.get('/signingup', async (req, res) => {
    let signmessage = undefined
    const { query } = req



    console.log(query)
    if (query.name && query.email) {
        let verificationcode = randomiseVerificationKey()
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
                        confirmed: false
                    })
                }
                alreadyExists = alreadyexists
    
            } catch(e) {
                console.log(`error: ${e}`)
                signmessage = `Failed to save to database, please try again. If this error keeps occuring, please contact Paige#3198 in our discord server: https://discord.gg/HYGJKjc.`
            }
            if (alreadyExists.exists == false) {
                let mailDetails = {
                    from: 'madmistyy@gmail.com',
                    to: `${query.email}`,
                    subject: 'Helix Account Verification',
                    text: `Hello there! \n\n Thanks for signing up at the Helix website! \n Your verification code is ${verificationcode}, this code will expire in 5 minutes. To verify your email, please go to localhost:3000/confirmemail \n\n Your Helix username is ${query.name} \n If you did NOT request a Helix account, please go to localhost:3000/cancelaccountverification and follow the steps.`
                }
                
                mailTransporter.sendMail(mailDetails, function(err, data) {
                    if(err) {
                        if (signmessage == undefined) {
                            signmessage = `Failed to send confirmation email, please try again. If this error keeps occuring, please contact Paige#3198 in our discord server: https://discord.gg/HYGJKjc.`
                            res.render('signingup.ejs', {message: signmessage})
                        }
                    } else {
                        console.log('Email sent successfully')
                        if (signmessage == undefined) {
                            signmessage = `Contacted Server, Please Check Your Email!`
                            res.render('signingup.ejs', {message: signmessage})
                        }
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


application.get('/users', (req, res) => {
    res.send("wow you're now in the user list this is so cool yes")
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




application.listen(3000, () => {
    console.log("listening on port 3000")
})