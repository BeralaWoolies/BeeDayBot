require('dotenv').config();

exports.hasBirthdayToday = function(date, month, day) {
    return month === date.getMonth() && day === date.getDate();
};

exports.announceBirthday = function(client, celebrantId) {
    const channel = client.channels.cache.get(process.env.CHANNEL_ID);
    channel.send(`🥳 HAPPY BIRTHDAY TO <@${celebrantId}>! 🥳`);
};
