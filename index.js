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

app.post("/addSchedule", (req, res) => {
    var {title, hours, mdays, minutes, months, wdays , id} = req.body
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
                mdays: [-1],
                minutes: [minutes],
                months: [-1],
                wdays: [-1]
            }
        }
    }
    console.log("Logging process")
    fetch(process.env.CRONJOBENDPOINT + 'jobs', {
        method: "PUT",
        headers: {
            'Authorization': "Bearer " + process.env.CRONJOBAUTHKEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(resp => res.status(resp.status).json({response: `Job scheduled successfully! with status ${resp.status}`}).end() )
    .catch(err => res.status(500).json({response: "Internal Server Error!"}).end())
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

app.get('/deleteJob', (req, res) => {
    jobId = req.query.jobid
    fetch(process.env.CRONJOBENDPOINT + 'jobs/' + jobId, {
        method: "DELETE",
        headers: {
            'Authorization': "Bearer " + process.env.CRONJOBAUTHKEY,
            'Content-Type': 'application/json'
        }
    })
    .then(resp => {
        console.log(resp)
        res.send(`${jobId} job deleted successfully! with status ${resp.status}`).end()
    })
    .catch(err => {
        console.log(err)
        res.status(500).send("Failed to delete job").end()
    })
})

app.listen(process.env.PORT || 4000, () => {
    console.log(`Listening on port ${process.env.PORT || 4000}`)
})
