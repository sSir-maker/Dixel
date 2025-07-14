const Event = require('../models/event');
const dotenv = require('dotenv');
const connectDatabase = require('../config/database');

const events = require('../data/event.json')//warning

// Setting dotenv file
dotenv.config({ path: 'backend/config/config.env' })

connectDatabase();

const seedEvents = async () => {
    try {
        
        await Event.deleteMany();
        console.log('Events are deleted');

        await Event.insertMany(events)
        console.log('all event are added.');

        process.exit()

    } catch (error) {
        console.log(error.message);
        process.exit()
    }
}

seedEvents()