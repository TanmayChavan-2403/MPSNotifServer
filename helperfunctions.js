require('dotenv').config()
const { ObjectId } = require('mongodb');
const {connectDB} = require('./connection');
const { min } = require('moment-timezone');
const { json } = require('express');

const chmap = {
    "a": 1, "b": 2,"c": 3,"d": 4,"e": 5,"f": 6,"g": 7,"h": 8, "i": 9,"j": 10, "k": 11,"l": 12,"m": 13, "n": 14,"o": 15,
    "p": 16,"q": 17,"r": 18, "s": 19, "t": 20,"u": 21, "v": 22, "w": 23, "x": 24, "y": 25, "z": 26
}

module.exports.fetchSubscription = function (userId){
    return new Promise( async (resolve, reject) => {
        // getting connection to mongodb database
        const mongo = await connectDB();

        // using the 'UserData' database
        const db = mongo.db("UserData")

        // getting 'credentials' collection
        const users = db.collection('credentials');
        const id = new ObjectId(userId)
        const data = await users.findOne({_id: id});

        if (data['notificationTurnedOn']){
            // getting 'notifications' collection
            const notifCollection = db.collection('notifications')
            const document = await notifCollection.findOne({_id: id})
            if (!document){
                return reject(`Document not found for userid ${id}`);
            }

            let movedObject, fromRevision, toRevision = null;

            let revisions = ['firstRevision', 'secondRevision', 'thirdRevision', 'fourthRevision', 'fifthRevision'];
            for (let i = 0; i < revisions.length; i ++){
                if (revisions[i].length > 0){
                    movedObject = document[revisions[i]][0];
                    fromRevision = revisions[i];
                    toRevision = i + 1 < revisions.length-1 ? revisions[i+1] : null;
                    break;
                }
            }

            if (!movedObject){
                return resolve([JSON.parse(data['subscriptionURL']), null]);
            }
            let updateQuery;
            if (toRevision){
                updateQuery = {$pull: {[fromRevision]: movedObject}, $push: {[toRevision]: movedObject}};
            } else {
                updateQuery = {$pull: {[fromRevision]: movedObject}};
            }
            notifCollection.updateOne({_id: id}, updateQuery)
            
            resolve([JSON.parse(data['subscriptionURL']), movedObject]);
        } else {
            reject("Subscription not found");
        }
    })
}

// THIS METHOD OF GENERATING UNIQUE ID IS NOT IN USE AS OF NOW.
module.exports.generateId = function (id) {
    const nums = "0123456789";
    let ans = ''
    for (let i = 0; i < id.length; i++) {
        let ch = id[i];
        if (nums.includes(ch)){
            ans += ch;
        } else {
            ans += chmap[ch];
        }
    }

    return Number(ans);
}

module.exports.correctTime = function(hours, minutes){
    diff = minutes - 30
    if (diff < 0){
        hours -= 1;
        minutes = 60 + diff
    } else {
        minutes -= 30
    }

    return {hours, minutes}
}