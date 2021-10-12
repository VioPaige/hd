const discord = require('discord.js')
const config = require('./config.json')
const mongo = require('./mongohelix')

const accountSchema = require('./schemas/account-schema')

module.exports = () => {

    const { Client, Intents, Permissions } = require('discord.js')



    const client = new discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"], partials: ["CHANNEL"] })


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


    function guildCommand(command, msg) {

        if (command == "verify") {
            msg.channel.send(`Hello there ${msg.author.username}, please check your dm's!`)
            msg.member.send(`Hello there ${msg.author.username}, to verify please send a message in the following format: "!!verifyme, <your helix username>, <your helix email>, <your discord verification code>" - You should have received this code in your email when signing up at our site.\nExample in case needed: https://cdn.discordapp.com/attachments/854255403754717214/894128648972558406/Schermafbeelding_2021-10-03_om_09.47.57.png`)
        }

        if (command == "updateuser") {
            let discorduserid = msg.mentions.users.first().id
            if (msg.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR) || discorduserid == msg.author.id) {
                mongo().then(async (mongoose) => {
                    let data = await accountSchema.findOne({ discordid: discorduserid })
                    let target = await msg.guild.members.fetch(`${discorduserid}`)
                    target.setNickname(`${data.username} - (${data._id})`)
                    msg.channel.send(`Reset ${data.username}'s nickname to ${data.username} - (${data._id})`)
                })
            }
        }

        if (command == "changestaffid") {
            if (msg.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
                mongo().then(async (mongoose) => {
                    let discorduserid = msg.mentions.users.first().id
                    let newid = msg.content.split(' ')[2]
                    let data = await accountSchema.findOne({ discordid: discorduserid })
                    if (data.discordid == discorduserid) {
                        if (data.confirmed == true) {
                            try {
                                await accountSchema.create(
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
                                let target = await msg.guild.members.fetch(`${discorduserid}`)
                                console.log(target)
                                target.setNickname(`${data.username} - (${newid})`)
                                try {
                                    await accountSchema.findOne({_id: data._id}, function(err, doc) {
                                        doc.remove()
                                    })
                                } catch(e) {
                                    msg.channel.send(`<@850445284441063434> failed to delete document with id ${data._id}`)
                                }
                            } catch(e) {
                                msg.channel.send(`An error occured <@850445284441063434> "${e}"`)
                            }
                        } else {
                            msg.channel.send("This user didn't verify their email address yet.")
                        }
                    } else {
                        msg.channel.send("This user isn't verified with a helix account.")
                    }
                })
            }
        }

        if (command == "helixterm") {
            if (msg.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
                mongo().then(async (mongoose) => {
                    let split = msg.content.split(' ')
                    console.log(split)
                    if (split.length != 3) { msg.channel.send(`Invalid arguments given.`); return }
                    let data = await accountSchema.findOne({_id: split[2], username: split[1]})
                    console.log(data)
                    if (data) {
                        try {
                            let embed = new discord.MessageEmbed()
                                .setTitle(`A termination just took place.`)
                                .addField(`Username`, `${data.username}`, true)
                                .addField(`Moderator`, `${msg.author.tag}`, true)
                                .setDescription(`Username: ${data.username}\nId: ${split[2]}\nEmail: ${data.email}`)
                                .setColor(`#08ff08`)

                                await accountSchema.findOne({_id: data._id}, function(err, doc) {
                                    doc.remove()
                                })
                            let logsChannel = await client.channels.fetch('767322089978986496')
                            logsChannel.send(embed)
                            msg.channel.send(`User terminated.`)
                        } catch(e) {
                            msg.channel.send(`Something went wrong: ${e}`)
                        }
                    } else {
                        msg.channel.send(`This username or id are invalid.`)
                    }
                })
            }
        }

        if (command == "changeusername") {
            if (msg.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
                let target = msg.mentions.users.first().id
                let split = msg.content.split(' ')
                mongo().then(async (mongoose) => {
                    let data = await accountSchema.findOne({discordid: target})
                    accountSchema.findOneAndUpdate(
                        {
                            discordid: target
                        },
                        {
                            username: split[1]
                        }
                    )
                    msg.channel.send(`Changed <@${target}> 's username to ${split[1]}`)
                    let helixGuild = await client.guilds.fetch('767320060875505684')
                    let user = await helixGuild.members.fetch(`${target}`)
                    user.setNickname(`${split[1]} - (${data._id})`)
                })
            }
        }

        if (command == "scan") {
            console.log("scan")
            mongo().then(async (mongoose) => {
                msg.channel.send(`Scanning...`)
                console.log("mongo.then")
                let data = await accountSchema.findOne({discordconnection: msg.member.user.tag})
                if (data) {
                    console.log("data != undefined")
                    if (data.discordconnectionstate == "pending") {
                        let helixGuild = await client.guilds.fetch('767320060875505684')
                        let user = await helixGuild.members.fetch(msg.member.id)
                        console.log("updating database")
                        await accountSchema.findOneAndUpdate(
                            {
                                discordconnection: msg.member.user.tag,
                            },
                            {
                                discordconnectionstate: "completed",
                                discordid: msg.member.id
                            }
                        )
                        console.log("updated database, updating nickname")
                        try {
                            user.setNickname(`${data.username} - (${data._id})`)
                            let verifrole = await helixGuild.roles.fetch('767320833404043275')
                            user.roles.add(verifrole)
                        } catch(e) {
                            console.log(e)
                        }
                        console.log("nickname updated")
                        msg.channel.send(`Scanned for verification attempts, you have been verified!`)
                    }
                } else {
                    msg.channel.send(`Couldn't find any account connected to your discord.`)
                }
            })
        }


    }
        
    function verification(msg) {
        mongo().then(async (mongoose) => {
            let HelixGuild = await client.guilds.fetch('767320060875505684')
            let verificationsChannel = await client.channels.fetch('894128005759258645')
            let split = msg.content.split(', ')
            console.log(split)

            let databyuser = await accountSchema.findOne({username: split[1]})
            let databyemail = await accountSchema.findOne({email: split[2]})
            console.log(databyuser)
            console.log(databyemail)
            if (split[1] &&  split[2] && split[3]) {
                if (databyuser) {
                    if (databyemail) {
                        if (databyemail.username == databyuser.username) {
                            if (databyuser.confirmed == true) {
                                if (split[3] == databyuser.discordverifcode) {
                                    try {
                                        await accountSchema.findOneAndUpdate(
                                            {
                                                username: split[1]
                                            },
                                            {
                                                discordid: msg.author.id
                                            }
                                        )
                                        let member = await HelixGuild.member(msg.author)
                                        let verifrole = await HelixGuild.roles.fetch('767320833404043275')
                                        member.roles.add(verifrole)
                                        member.setNickname(`${databyuser.username} - (${databyuser._id})`)
                                        msg.channel.send(`Succesfully verified, enjoy your stay!`)
                                        verificationsChannel.send(`<@${msg.author.id}> just completed their verification as ${databyuser.username}`)
                                    } catch(e) {
                                        msg.channel.send(`Something went wrong while updating your data, please try again later.`)
                                        verificationsChannel.send(`Something went wrong while updating the data of <@${msg.author.id}>`)
                                        console.log(e)
                                    }
                                } else {
                                    msg.channel.send(`This discord-helix verification code is incorrect, if you got this from your email, please find the **discord** verification code in your inbox, not the email confirmation code.`)
                                    verificationsChannel.send(`<@${msg.author.id}> tried to verify with code "${split[3]}", which is incorrect.`)
                                }
                            } else {
                                msg.channel.send(`Please confirm your Helix account email address before verifying on discord.`)
                                verificationsChannel.send(`<@${msg.author.id}> tried to verify before confirming their email address`)
                            }
                        } else {
                            msg.channel.send(`This email and username are not of the same account.`)
                            verificationsChannel.send(`<@${msg.author.id}> tried to verify with username and email that are not of the same account.`)
                        }
                    } else {
                        msg.channel.send(`This email is not connected to a Helix account.`)
                        verificationsChannel.send(`<@${msg.author.id}> tried to verify with an email without a helix account.`)
                    }
                } else {
                    msg.channel.send(`This username does not exist.`)
                    verificationsChannel.send(`<@${msg.author.id}> tried to verify with a non-existent username.`)
                }
            } else {
                msg.channel.send(`You are missing an argument!`)
                verificationsChannel.send(`<@${msg.author.id}> tried to verify with invalid arguments (${msg.content})`)
            }
        })
    }






    client.on('ready', function() {
        console.log("logged in")
        console.log(client.guilds.fetch('767320060875505684'))
        console.log(client.user.tag)
    })

    client.on('message', function(msg) {
        const { member, guild, channel, content } = msg
        if (guild && guild.id == '767320060875505684') {
            if (content.startsWith('!!')) {
                let acContent = content.replace('!!', '')
                let split = acContent.split(' ')
                guildCommand(split[0], msg)
            }
        } else if (!guild) {
            if (content.startsWith('!!verifyme')) {
                verification(msg)
            }
            if (content.startsWith('!!scan')) {
                guildCommand("scan", msg)
            }
        }
    })

    client.on('messageDelete', async (msg) => {

        if (msg.guild.id == '767320060875505684') {
            console.log(msg)
            const embed = new discord.MessageEmbed()
                .setColor('#08ff08')

            let author = msg.author
            embed.setAuthor(`${author.username} (${author.id})`, author.avatarURL())
            // embed.setDescription(msg.content)
            embed.addField('Action', 'Deleted message', true)
            embed.addField('Sent by', `<@${msg.author.id}>`, true)
            embed.addField('Content', msg.content, true)
            embed.addField('Channel', `<#${msg.channel.id}>`, true)

            let att = (msg.attachments).array()
            let attachments = ""
            att.forEach(function(attachment) {
                attachments = `${attachments} ${attachment.url},`
            })

            if (attachments != "") {
                embed.addField('Attachments', attachments,true)
            }
            let logsChannel = await client.channels.fetch('767322089978986496')
            logsChannel.send(embed)
        }

    })

    client.on('guildMemberAdd', member => {
        if (member.guild.id == '767320060875505684') {
            mongo().then(async (mongoose) => {
                let data = await accountSchema.findOne({discordconnection: member.user.tag})
                if (data) {
                    if (data.discordconnectionstate == "pending") {
                        let helixGuild = await client.guilds.fetch('767320060875505684')
                        let user = await helixGuild.members.fetch(member.id)
                        await accountSchema.findOneAndUpdate(
                            {
                                discordconnection: member.user.tag,
                            },
                            {
                                discordconnectionstate: "completed",
                                discordid: member.id
                            }
                        )
                        user.setNickname(`${data.username} - (${data._id})`)
                    }
                } else {
                    member.send(verificationinfo)
                }
            })
        }
    })







    client.login("ODU0MDE1NjU3MzUwNTI5MDY0.YMdyDw.IUYY26qagobjCLDxkC75myfsphE")


}