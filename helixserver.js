//module requiring
const discord = require('discord.js')
const config = require('./config.json')
const mongo = require('./mongohelix')

const accountSchema = require('./schemas/account-schema') // mongodb schema import

module.exports = () => { //export module to be used in other scripts

    const { Client, Intents, Permissions } = require('discord.js') // define variables from discord.js



    const client = new discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"], partials: ["CHANNEL"] }) // make discord client in bot account

    // a string to be used later
    const verificationinfo = ` 
        Verification Method 1:
          1. Go to https://helixsite2.herokuapp.com/ and sign up
          2. You will receive an email that contains 2 things: Your email confirmation link, and your discord verification code, thus, do NOT delete the email, your discord verification code will stay forever. 
          3. Press the link and confirm your email address
          4. Run the command "!!verify" watch out, there's a double exclamation mark in the command (obviously without the "") in verify and follow the instructions the bot sends you in dms (you will need your helix username, email, and discord verification code)

        Verification Method 2:
          1. Go to https://helixsite2.herokuapp.com/ and sign up
          2. You will receive an email that contains a confirmation link, press it
          3. Go to https://helixsite2.herokuapp.com/conndiscord and fill in the email connected to your account and your discord account.
          4. Send "!!scan" in <#767324117296742411> 
    `

    
    function guildCommand(command, msg) { // function to be run when a command is sent in a server (not in dm)

        if (command == "verify") { // command is verify
            msg.channel.send(`Hello there ${msg.author.username}, please check your dm's!`) // sends message to command channel
            msg.member.send(`Hello there ${msg.author.username}, to verify please send a message in the following format: "!!verifyme, <your helix username>, <your helix email>, <your discord verification code>" - You should have received this code in your email when signing up at our site.\nExample in case needed: https://cdn.discordapp.com/attachments/854255403754717214/894128648972558406/Schermafbeelding_2021-10-03_om_09.47.57.png`)  // sends dm to user
        }

        if (command == "updateuser") { // command is updateuser
            let discorduserid = msg.mentions.users.first().id // defines the id of the mentioned user
            if (msg.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR) || discorduserid == msg.author.id) { // checks if user sent has admin perm or is the target
                mongo().then(async (mongoose) => { // connects to mongo
                    let data = await accountSchema.findOne({ discordid: discorduserid }) // gets data
                    let target = await msg.guild.members.fetch(`${discorduserid}`) // gets guildmember object by id
                    target.setNickname(`${data.username} - (${data._id})`) // changes target nickname
                    msg.channel.send(`Reset ${data.username}'s nickname to ${data.username} - (${data._id})`) // sends response in command channel
                })
            }
        }

        if (command == "changestaffid") { // command is changestaffid
            if (msg.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) { // checks for admin permission
                mongo().then(async (mongoose) => { // connects to db
                    let discorduserid = msg.mentions.users.first().id // gets id of first mention
                    let newid = msg.content.split(' ')[2] // gets new id from message content
                    let data = await accountSchema.findOne({ discordid: discorduserid }) // gets data
                    if (data.discordid == discorduserid) { // checks if correct data exists
                        if (data.confirmed == true) { // checks if user confirmed email
                            try { // try
                                await accountSchema.create( // creates document in db schema
                                    {
                                        _id: newid,
                                        username: data.username,
                                        email: data.email,
                                        verifcode: "noverifcode",
                                        confirmed: true,
                                        discordverifcode: data.discordverifcode,
                                        discordid: data.discordid
                                    }
                                )
                                let target = await msg.guild.members.fetch(`${discorduserid}`) // sets target
                                console.log(target) // logs
                                target.setNickname(`${data.username} - (${newid})`) // sets target nickname
                                try { // try
                                    await accountSchema.findOne({_id: data._id}, function(err, doc) { // removes old doc from db
                                        doc.remove()
                                    })
                                } catch(e) { // catch
                                    msg.channel.send(`<@850445284441063434> failed to delete document with id ${data._id}`) // response
                                }
                            } catch(e) { // catch
                                msg.channel.send(`An error occured <@850445284441063434> "${e}"`) // response
                            }
                        } else { // else
                            msg.channel.send("This user didn't verify their email address yet.") //response
                        }
                    } else {
                        msg.channel.send("This user isn't verified with a helix account.") // response
                    }
                })
            }
        }

        if (command == "helixterm") { // command is helixterm
            if (msg.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) { // checks for admin
                mongo().then(async (mongoose) => { // connect db
                    let split = msg.content.split(' ') // splits msg content by space
                    console.log(split) // log
                    if (split.length != 3) { msg.channel.send(`Invalid arguments given.`); return } // response if missing arguments
                    let data = await accountSchema.findOne({_id: split[2], username: split[1]}) // get data
                    console.log(data) // log
                    if (data) { // check if data exists
                        try { // try
                            let embed = new discord.MessageEmbed() // create and edit embed
                                .setTitle(`A termination just took place.`)
                                .addField(`Username`, `${data.username}`, true)
                                .addField(`Moderator`, `${msg.author.tag}`, true)
                                .setDescription(`Username: ${data.username}\nId: ${split[2]}\nEmail: ${data.email}`)
                                .setColor(`#08ff08`)

                                await accountSchema.findOne({_id: data._id}, function(err, doc) { // remove doc from db
                                    doc.remove()
                                })
                            let logsChannel = await client.channels.fetch('767322089978986496') // defines logging channel
                            logsChannel.send(embed) // sends termination log
                            msg.channel.send(`User terminated.`) // response
                        } catch(e) { // catch
                            msg.channel.send(`Something went wrong: ${e}`) // response
                        }
                    } else {
                        msg.channel.send(`This username or id are invalid.`) // response
                    }
                })
            }
        }

        if (command == "changeusername") { // command is changeusername
            if (msg.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) { // checks for admin
                let target = msg.mentions.users.first().id // take target id from mention
                let split = msg.content.split(' ') // split message
                mongo().then(async (mongoose) => { // connect db
                    let data = await accountSchema.findOne({discordid: target}) // get data
                    accountSchema.findOneAndUpdate( // update data
                        {
                            discordid: target
                        },
                        {
                            username: split[1]
                        }
                    )
                    msg.channel.send(`Changed <@${target}> 's username to ${split[1]}`) // response
                    let helixGuild = await client.guilds.fetch('767320060875505684') // define custom server
                    let user = await helixGuild.members.fetch(`${target}`) // get target guildmember
                    user.setNickname(`${split[1]} - (${data._id})`) // change target nickname
                })
            }
        }

        if (command == "scan") { // command is scan
            console.log("scan") // log
            mongo().then(async (mongoose) => { // connect db
                msg.channel.send(`Scanning...`) // response #1
                console.log("mongo.then") // log
                let data = await accountSchema.findOne({discordconnection: msg.member.user.tag}) // get data
                if (data) { // if data exists
                    console.log("data != undefined") // log
                    if (data.discordconnectionstate == "pending") { // checks if pending data
                        let helixGuild = await client.guilds.fetch('767320060875505684') // define custom server
                        let user = await helixGuild.members.fetch(msg.member.id) // find member by id
                        console.log("updating database") // log
                        await accountSchema.findOneAndUpdate( // update db
                            {
                                discordconnection: msg.member.user.tag,
                            },
                            {
                                discordconnectionstate: "completed",
                                discordid: msg.member.id
                            }
                        )
                        console.log("updated database, updating nickname") // log
                        try { // try
                            user.setNickname(`${data.username} - (${data._id})`) // change nickname
                            let verifrole = await helixGuild.roles.fetch('767320833404043275') // define role
                            user.roles.add(verifrole) // add role
                        } catch(e) { // catch
                            console.log(e) // log
                        }
                        console.log("nickname updated") // log
                        msg.channel.send(`Scanned for verification attempts, you have been verified!`) // response #2
                    }
                } else { // else
                    msg.channel.send(`Couldn't find any account connected to your discord.`) // response
                }
            })
        }


    }
        
    function verification(msg) { // define function verification
        mongo().then(async (mongoose) => { // connect db
            let HelixGuild = await client.guilds.fetch('767320060875505684') // define server
            let verificationsChannel = await client.channels.fetch('894128005759258645') // define verifications channel
            let split = msg.content.split(', ') // split message by space
            console.log(split) // log

            let databyuser = await accountSchema.findOne({username: split[1]}) // get data by username
            let databyemail = await accountSchema.findOne({email: split[2]}) // get data by email
            console.log(databyuser) // log
            console.log(databyemail) // log
            if (split[1] &&  split[2] && split[3]) { // valid arguments?
                if (databyuser) { // existing username?
                    if (databyemail) { // existing email?
                        if (databyemail.username == databyuser.username) { // matching user and email?
                            if (databyuser.confirmed == true) { // confirmed email address?
                                if (split[3] == databyuser.discordverifcode) { // correct verification code?
                                    try { // try
                                        await accountSchema.findOneAndUpdate( // update db
                                            {
                                                username: split[1]
                                            },
                                            {
                                                discordid: msg.author.id
                                            }
                                        )
                                        let member = await HelixGuild.member(msg.author) // define target
                                        let verifrole = await HelixGuild.roles.fetch('767320833404043275') // define role
                                        member.roles.add(verifrole) // give role to target
                                        member.setNickname(`${databyuser.username} - (${databyuser._id})`) // change nickname
                                        msg.channel.send(`Succesfully verified, enjoy your stay!`) // response
                                        verificationsChannel.send(`<@${msg.author.id}> just completed their verification as ${databyuser.username}`) // log
                                    } catch(e) { // catch
                                        msg.channel.send(`Something went wrong while updating your data, please try again later.`) // response
                                        verificationsChannel.send(`Something went wrong while updating the data of <@${msg.author.id}>`) // log
                                        console.log(e) // log
                                    }
                                } else { // else
                                    msg.channel.send(`This discord-helix verification code is incorrect, if you got this from your email, please find the **discord** verification code in your inbox, not the email confirmation code.`) // response
                                    verificationsChannel.send(`<@${msg.author.id}> tried to verify with code "${split[3]}", which is incorrect.`) // log
                                }
                            } else { // else
                                msg.channel.send(`Please confirm your Helix account email address before verifying on discord.`) // response
                                verificationsChannel.send(`<@${msg.author.id}> tried to verify before confirming their email address`) // log
                            }
                        } else {
                            msg.channel.send(`This email and username are not of the same account.`) // response
                            verificationsChannel.send(`<@${msg.author.id}> tried to verify with username and email that are not of the same account.`) // log
                        }
                    } else {
                        msg.channel.send(`This email is not connected to a Helix account.`) // response
                        verificationsChannel.send(`<@${msg.author.id}> tried to verify with an email without a helix account.`) // log
                    }
                } else {
                    msg.channel.send(`This username does not exist.`) // response
                    verificationsChannel.send(`<@${msg.author.id}> tried to verify with a non-existent username.`) // log
                }
            } else {
                msg.channel.send(`You are missing an argument!`) // response
                verificationsChannel.send(`<@${msg.author.id}> tried to verify with invalid arguments (${msg.content})`) // log
            }
        })
    }






    client.on('ready', function() { // discord event
        console.log("logged in") // log
        console.log(client.guilds.fetch('767320060875505684')) // log
        console.log(client.user.tag) // log
    })

    client.on('message', function(msg) { // discord event
        const { member, guild, channel, content } = msg // define vars
        if (guild && guild.id == '767320060875505684') { // check if correct guild
            if (content.startsWith('!!')) { // message is command?
                let acContent = content.replace('!!', '') // remove prefix
                let split = acContent.split(' ') // split message
                guildCommand(split[0], msg) // call function
            }
        } else if (!guild) { // if dm
            if (content.startsWith('!!verifyme')) { // if command verifyme
                verification(msg) // call function
            }
            if (content.startsWith('!!scan')) { // if command scan
                guildCommand("scan", msg) // call function
            }
        }
    })

    client.on('messageDelete', async (msg) => { // discord event

        if (msg.guild.id == '767320060875505684') { // is it correct server?
            console.log(msg) // log
            const embed = new discord.MessageEmbed() // new embed
                .setColor('#08ff08') // modify embed

            let author = msg.author
            embed.setAuthor(`${author.username} (${author.id})`, author.avatarURL())
            // embed.setDescription(msg.content)
            embed.addField('Action', 'Deleted message', true)
            embed.addField('Sent by', `<@${msg.author.id}>`, true)
            embed.addField('Content', msg.content, true)
            embed.addField('Channel', `<#${msg.channel.id}>`, true)

            let att = (msg.attachments).array() // get attachments from message
            let attachments = ""
            att.forEach(function(attachment) { // add attachments to string
                attachments = `${attachments} ${attachment.url},`
            })

            if (attachments != "") { // if attachments exist
                embed.addField('Attachments', attachments,true) // modify embed
            }
            let logsChannel = await client.channels.fetch('767322089978986496') // define logging channel
            logsChannel.send(embed) // log
        }

    })

    client.on('guildMemberAdd', member => { // new member
        if (member.guild.id == '767320060875505684') { // correct server?
            mongo().then(async (mongoose) => { // connect db
                let data = await accountSchema.findOne({discordconnection: member.user.tag}) // get data by discord id
                if (data) { // does data exist?
                    if (data.discordconnectionstate == "pending") { // is account connection pending?
                        let helixGuild = await client.guilds.fetch('767320060875505684') // define server
                        let user = await helixGuild.members.fetch(member.id) // define user
                        await accountSchema.findOneAndUpdate( // update
                            {
                                discordconnection: member.user.tag,
                            },
                            {
                                discordconnectionstate: "completed",
                                discordid: member.id
                            }
                        )
                        user.setNickname(`${data.username} - (${data._id})`) // change nickname
                    }
                } else { // else
                    member.send(verificationinfo) // inform member about verification methods
                }
            })
        }
    })







    client.login("token") // log in


}
