const { Events } = require('discord.js');
const CronJob = require('cron').CronJob;
const mongoose = require('mongoose');
const {
    announceBirthday,
    hasBirthdayToday,
} = require('../helpers/birthdayHelpers.js');
const database = require('../schemas/birthday.js');
require('dotenv').config();

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        mongoose.set('strictQuery', false);
        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('Successfully connected to the database');

            // Check birthdays every night at midnight
            const job = new CronJob(
                '0 0 0 * * *',
                async function() {
                    const users = await database.find();
                    const celebrants = users.filter(user => hasBirthdayToday(user));
                    for (const celebrant of celebrants) {
                        await announceBirthday(client, celebrant.discordId);
                    }
                },
                null,
                false,
                'Australia/Sydney'
            );
            job.start();
            console.log('Job has successfully started');
        } catch (error) {
            console.error(error);
        }
    },
};
