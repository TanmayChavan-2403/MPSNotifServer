require('dotenv').config();
const fs = require('fs')
const path = require('path');
const Express = require('express');
const webpush = require('web-push');
const moment = require('moment-timezone');
const helpers = require('./helperfunctions')
let cors = require('cors');
const { Console } = require('console');

const app = Express()

app.use(Express.json())
app.use(cors({"origin": "*"}))

webpush.setVapidDetails(
    "mailto:codebreakers1306@gmail.com",
    process.env.PUBLIC_KEY,
    process.env.PRIVATE_KEY
)

app.get("/", (req, res) => {
    res.send("Server is up and running").end()
})

app.get('/notify', async (req, res) => {
    // Example id = 6415d631ed97f5d33459bd65
    // Getting subscription URL from database
    helpers.fetchSubscription(req.query.id)
    .then(([subscription, word]) => {
        if (!word){
            word = {"Empty collection": "Please add words to notify"}
        }
        let payload = JSON.stringify({
            title: '🔔 Todays word:- ' + Object.keys(word)[0],
            body: Object.values(word)[0],
            flag: false,
            link: "https://tanmaychavan2403.web.app/"
        })
    
        webpush.sendNotification(subscription, payload)
        .then(data => {
            res.json({
                notified: 'Success',
                NotificationSent: Object.keys(word)[0] + ':  ' + Object.values(word)[0],
            })
        })
        .catch(err => {
            console.log(err);
            res.json({
                notified: 'Failed',
                error: err
            })
        })
    })
    .catch(err => {
        console.log(err);
        res.json({
            err
        })
    })
})

app.post("/addSchedule", (req, res) => {
    var {title, minutes, hours, mdays, wdays, months , id} = req.body
    var {hours, minutes} = helpers.correctTime(hours, minutes)

    const payload = {
        job:{
            enabled: true,
            title,
            saveResponses: false,
            url: process.env.NOTIF_SERVER + id,
            requestTimeout: 5000,
            schedule: {
                timezone: "Indian/Maldives",
                expiresAt: 0,
                hours: [hours],
                mdays: [mdays],
                minutes: [minutes],
                months: [months],
                wdays: [wdays]
            }
        }
    }
    
    fetch(process.env.CRONJOBENDPOINT + 'jobs', {
        method: "PUT",
        headers: {
            'Authorization': "Bearer " + process.env.CRONJOBAUTHKEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(resp => {
        return resp.json()
    })
    .then(data => {
        res.status(200).json({title, jobId: data.jobId }).end()
    })
    .catch(err => {
        res.status(500).json({response: "Internal Server Error!"}).end()
    })
})

app.get('/listJobs', (req, res) => {
    id ='2465131518149147'
    const jobid = req.query.jobid
    fetch(process.env.CRONJOBENDPOINT + 'jobs', {
        method: "GET",
        headers: {
            'Authorization': "Bearer " + process.env.CRONJOBAUTHKEY,
            'Content-Type': 'application/json'
        }
    })
    .then(resp => resp.json())
    .then(data => {
        res.json({"result": data})
    })
    .catch(err => res.json({"error": err}))
})

app.delete('/deleteJob', (req, res) => {
    
    jobId = req.body['jobid']
    setTimeout(() => {
        res.sendStatus(200).end()
    }, 1500);

    // fetch(process.env.CRONJOBENDPOINT + 'jobs/' + jobId, {
    //     method: "DELETE",
    //     headers: {
    //         'Authorization': "Bearer " + process.env.CRONJOBAUTHKEY,
    //         'Content-Type': 'application/json'
    //     }
    // })
    // .then(resp => {
    //     res.sendStatus(resp.status).end()
    // })
    // .catch(err => {
    //     res.sendStatus(500).end()
    // })
})

app.listen(process.env.PORT || 4000, () => {
    console.log(`Listening on port ${process.env.PORT || 4000}`)
})
