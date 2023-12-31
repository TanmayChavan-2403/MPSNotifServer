require('dotenv').config();
const fs = require('fs')

const path = require('path');
const Express = require('express');
const webpush = require('web-push');
const moment = require('moment-timezone');
const helpers = require('./helperfunctions')
let cors = require('cors');

const app = Express()

webpush.setVapidDetails(
    "mailto:codebreakers1306@gmail.com",
    process.env.PUBLIC_KEY,
    process.env.PRIVATE_KEY
)

app.get('/notify', async (req, res) => {
    // Getting subscription URL from database
    helpers.fetchSubscription(req.query.id)
    .then((subscription) => {
        let payload = JSON.stringify({
            title: '🔔 Todays word:- ' + "Test meaning",
            body: "Test body",
            flag: false,
            link: "https://my-meanings-server.onrender.com/sendLogFile"
        })
    
        webpush.sendNotification(subscription, payload)
        .then(data => {
            res.json({
                notified: 'Success',
                CurrentDataCount: 0,
                NotificationSent: "Word" + ':   ' + "and its meaning",
            })
        })
        .catch(err => {
            console.log(err)
            res.json({
                notified: 'Failed',
                error: err
            })
        })
    })
    .catch(err => {
        console.log(err);
    })
})

// app.get("/addSchedule", (req, res) => {
//     const userId = '6415d631ed97f5d33459bd65'
//     const name = 'morning'
//     const id =  helpers.generateId(userId.substring(userId.length - 4), name)
//     console.log('Id generated is ', id)
//     const payload = {
//         job: {
//             id: id,
//             title: "Job creation testing!",
//             url: process.env.CRONJOBENDPOINT,
//             requestTimeout: 5,
//             schedule: {
//                 timezone: "Indian/Maldives",
//                 expiresAt: 0,
//                 hours: 
//             }
//         }
//     }

//     fetch(process.env.CRONJOBENDPOINT, {
//         method: PUT,
//         headers: {
//             'Authorization': process.env.CRONJOBAUTHKEY,
//             'Content-Type': 'application/json'
//         },
//         body: json.stringify(payload)
//     })
// }) 

app.listen(process.env.PORT || 4000, () => {
    console.log(`Listening on port ${process.env.PORT || 4000}`)
})