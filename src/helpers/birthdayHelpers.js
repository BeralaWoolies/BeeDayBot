const database = require('../database.js');
require('dotenv').config();

exports.hasBirthdayToday = function(month, day) {
    const now = new Date();
    return month === now.getMonth() && day === now.getDate();
};

exports.announceBirthday = function(client, celebrantId) {
    const channel = client.channels.cache.get(process.env.CHANNEL_ID);
    channel.send(`🥳 HAPPY BIRTHDAY TO <@${celebrantId}>! 🥳`);
};

exports.hasBirthdayRegistered = function(discordId) {
    const data = database.getData();
    return (data.filter(user => user.id === discordId).length !== 0);
};

exports.isIdenticalBirthday = function(discordId, birthday) {
    const data = database.getData();
    const { birthdayMonth, birthdayDay } = exports.parseBirthdayString(birthday);
    return (data.filter(user =>
        user.id === discordId &&
        user.month === birthdayMonth &&
        user.day === birthdayDay).length !== 0);
};

exports.getBirthdayFromId = function(discordId) {
    const data = database.getData();
    return data.find(user => user.id === discordId);
};

exports.parseBirthdayString = function(birthday) {
    const digits = birthday.split('/').map(digit => parseInt(digit));
    return {
        birthdayMonth: digits[1] - 1,
        birthdayDay: digits[0],
    };
};
