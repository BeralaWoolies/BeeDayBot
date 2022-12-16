const wait = require('node:timers/promises').setTimeout;
const isLeapYear = require('date-fns/isLeapYear');
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require('discord.js');
const { disableAllButtons } = require('./buttonHelpers.js');
const database = require('../database.js');
require('dotenv').config();

exports.hasBirthdayToday = function(discordId) {
    const user = exports.getUserFromId(discordId);
    const now = new Date();
    // Leaplings' bdays will be celebrated on either 1st of March or
    // 28th of February on non-leap years
    if (exports.isLeapling(user.month, user.day) && !isLeapYear(now)) {
        if (user.celebrateBefore) {
            return now.getMonth() === 1 && now.getDate() === 28;
        } else {
            return now.getMonth() === 2 && now.getDate() === 1;
        }
    }
    return user.month === now.getMonth() && user.day === now.getDate();
};

exports.announceBirthday = function(client, discordId) {
    const channel = client.channels.cache.get(process.env.CHANNEL_ID);
    channel.send(`🥳 HAPPY BIRTHDAY TO <@${discordId}>! 🥳`);
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

exports.parseBirthdayString = function(birthday) {
    const digits = birthday.split('/').map(digit => parseInt(digit));
    return {
        birthdayMonth: digits[1] - 1,
        birthdayDay: digits[0],
    };
};

exports.getUserFromId = function(discordId) {
    const data = database.getData();
    return data.find(user => user.id === discordId);
};

exports.isLeapling = function(month, day) {
    return month === 1 && day === 29;
};

exports.handleLeaplingPreference = async function(interaction, birthdayMonth, birthdayDay) {
    let celebrateBefore = null;
    let leaplingBirthday = null;
    if (exports.isLeapling(birthdayMonth, birthdayDay)) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('celebrate before')
                    .setLabel('28th of February!')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('celebrate after')
                    .setLabel('1st of March!')
                    .setStyle(ButtonStyle.Primary)
            );

        const message = await interaction.reply({
            content: 'Hello leapling! would you like to celebrate your birthday on the 28th of February or 1st of March on non-leap years',
            ephemeral: true,
            components: [row],
            fetchReply: true,
        });

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            max: 1,
            time: 10000,
        });
        collector.on('collect', async i => {
            i.deferUpdate();
            if (i.user.id === interaction.user.id) {
                if (i.customId === 'celebrate before') {
                    leaplingBirthday = '28th of February';
                    celebrateBefore = true;
                } else if (i.customId === 'celebrate after') {
                    leaplingBirthday = '1st of March';
                    celebrateBefore = false;
                }
                disableAllButtons(row);
                await interaction.editReply({
                    content: 'Hello leapling! would you like to celebrate your birthday on the 28th of February or 1st of March on non-leap years.',
                    ephemeral: true,
                    components: [row],
                });
                await interaction.followUp({
                    content: 'Processing...',
                    ephemeral: true,
                });
            }
        });
        await wait(10000);
    }
    return {
        celebrateBefore: celebrateBefore,
        leaplingBirthday: leaplingBirthday,
    };
};
