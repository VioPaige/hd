document.addEventListener('DOMContentLoaded',  function() {

    let notInUsernameArray = ["-", ",", ";", ":", "[", "]", "(", ")", "{", "}", "!", "@", "#", "$", "%", "^", "&", "*", "§", "±", "~", "`", "=", "/", `"`, `'`, "+"]


    let form = document.getElementById('email-form')
    let usernameInput = document.getElementById('name')
    let emailInput = document.getElementById('email')
    let canOnlyInclude = document.getElementById('canonlyinclude')
    let invalidemail = document.getElementById('invalidemail')
    let badwordusername = document.getElementById('vulgaritiesinusername')

    let signupbutton = document.getElementById('signupbutton')

    let disabled = ""


    form.addEventListener('submit', function(e) {
        if (disabled.includes("email") || disabled.includes("username")) {
            e.preventDefault()
        }
    })


    usernameInput.oninput = function() {
        // console.log("oauwehoiajwrg")
        // console.log(usernameInput.value)
        let lc = usernameInput.value.toLowerCase()
        let forbidden = false
        let badwordforbidden = false
        let activebadword = ""
        for (let i of notInUsernameArray) {
            if (usernameInput.value.includes(i)) {
                // console.log("forbidden because includes forbidden character")
                forbidden = true
            }
        }


        let whitelist = "abcdefghijklmnopqrstuvwxyz1234567890_"
        let split = lc.split('')
        for (let i of split) {
            if (!whitelist.includes(i.toLowerCase())) {
                // console.log("forbidden because includes non-whitelisted")
                forbidden = true
            }
        }
        
        let blacklist = ["arse", "ass", "bastard", "bitch", "bollocks", "fuck", "bugger", "shit", "cock", "cunt", "dick", "crap", "damn", "effing", "frick", "frig", "god", "nigga", "nigger", "piss", "prick", "slut", "hoe", "whore", "twat", "cum", "69"]
        let identicals = {
            "1": "i",
            "3": "e",
            "0": "o"
        }

        for (let i of blacklist) {
            if (lc.includes(i)) {
                badwordforbidden = true
                forbidden = true
                activebadword = i
            }
        }

        for (let [i, v] of Object.entries(identicals)) {
            let replaced = lc.replaceAll(i, v)

            for (let i of blacklist) {
                if (replaced.includes(i)) {
                    badwordforbidden = true
                    forbidden = true
                    activebadword = i
                }
            }
        }
        // if (badwordforbidden) {
        //     console.log("badword")
        //     usernameInput.setAttribute("class", "logup-fields-red w-input")
        //     canOnlyInclude.setAttribute("class", "about-paragraphs-red")
        //     signupbutton.setAttribute("class", "sign-up-button-disabled w-button")
        //     signupbutton.setAttribute("disabled", true)
        // } else {
        //     usernameInput.setAttribute("class", "logup-fields w-input")
        //     canOnlyInclude.setAttribute("class", "about-paragraphs-cantcontain")
        //     signupbutton.setAttribute("class", "sign-up-button w-button")
        //     signupbutton.removeAttribute("disabled")
        // }


        if (forbidden) {
            disabled = `${disabled}username`
            usernameInput.setAttribute("class", "logup-fields-red w-input")
            canOnlyInclude.setAttribute("class", "about-paragraphs-red")
            signupbutton.setAttribute("class", "sign-up-button-disabled w-button")
            signupbutton.setAttribute("disabled", "")
        } else {
            disabled = disabled.replaceAll("username", "")
            usernameInput.setAttribute("class", "logup-fields w-input")
            canOnlyInclude.setAttribute("class", "about-paragraphs-cantcontain")
            signupbutton.setAttribute("disabled", "")
            if (!disabled.includes("email") && !disabled.includes("username")) {
                signupbutton.setAttribute("class", "sign-up-button w-button")
                signupbutton.removeAttribute("disabled")
            }
        }
    }



    email.oninput = function() {
        let validemail = true
        if (!email.value.includes("@")) {
            validemail = false
        }
        if (!email.value.includes(".")) {
            validemail = false
        }
        if (!validemail) {
            disabled = `${disabled}email`
            emailInput.setAttribute("class", "logup-fields-red w-input")
            invalidemail.setAttribute("class", "about-paragraphs-red")
            signupbutton.setAttribute("class", "sign-up-button-disabled w-button")
            signupbutton.setAttribute("disabled", "")
        } else {
            disabled = disabled.replaceAll("email", "")
            emailInput.setAttribute("class", "logup-fields w-input")
            invalidemail.setAttribute("class", "about-paragraphs-cantcontain")
            signupbutton.setAttribute("disabled", "")
            if (!disabled.includes("email") && !disabled.includes("username")) {
                signupbutton.setAttribute("class", "sign-up-button w-button")
                signupbutton.removeAttribute("disabled")
            }
        }
    }



})