const wait = require('node:timers/promises').setTimeout;
const isLeapYear = require('date-fns/isLeapYear');
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
} = require('discord.js');
const { disableAllButtons } = require('./buttonHelpers.js');
const database = require('../schemas/birthday.js');
require('dotenv').config();

exports.hasBirthdayToday = function(user) {
    const sydneyDateStr = new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
    const now = new Date(sydneyDateStr);

    // celebrate leaplings' birthday on either 28th of February or 1st of March
    if (exports.isLeapling(user.month, user.day) && !isLeapYear(now)) {
        if (user.celebrateBefore) {
            return now.getMonth() === 1 && now.getDate() === 28;
        } else {
            return now.getMonth() === 2 && now.getDate() === 1;
        }
    }
    return user.month === now.getMonth() && user.day === now.getDate();
};

exports.announceBirthday = async function(client, discordId) {
    try {
        const channel = client.channels.cache.get(process.env.CHANNEL_ID);
        const celebrant = await client.users.fetch(discordId);
        const birthdayEmbed = new EmbedBuilder()
            .setColor(0x3AFF00)
            .setDescription(`🥳 HAPPY BIRTHDAY TO <@${discordId}> 🥳`)
            .setAuthor({ name: celebrant.username, iconURL: celebrant.avatarURL() });
        channel.send({ content: '@everyone', embeds: [birthdayEmbed] })
            .then(async sentMsg => {
                const reactions = ['🎉', '🎂', '🥳', '🎊', '🎈'];
                for (const emoji of reactions) {
                    await sentMsg.react(emoji);
                }
            })
            .catch((error) => {
                console.error(error);
            });
    } catch (error) {
        console.error(error);
    }
};

exports.hasBirthdayRegistered = async function(discordId) {
    const user = await exports.getUserFromId(discordId);
    return user !== null;
};

exports.parseBirthdayString = function(birthday) {
    const digits = birthday.split('/').map(digit => parseInt(digit));
    return {
        birthdayMonth: digits[1] - 1,
        birthdayDay: digits[0],
    };
};

exports.getUserFromId = async function(discordId) {
    return await database.findOne({ discordId: discordId }).exec();
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
        const leaplingEmbed = new EmbedBuilder()
            .setColor(0xA500FF)
            .setTitle('👋 **Hello leapling!** 👋')
            .setDescription('Would you like to celebrate your birthday on the **28th of February** or **1st of March** during **non-leap** years')
            .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.avatarURL() });
        const message = await interaction.reply({
            ephemeral: true,
            components: [row],
            embeds: [leaplingEmbed],
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
                    ephemeral: true,
                    components: [row],
                });

                const processingEmbed = new EmbedBuilder()
                    .setColor(0xA500FF)
                    .setDescription('**Processing...**')
                    .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.avatarURL() });
                await interaction.followUp({
                    ephemeral: true,
                    embeds: [processingEmbed],
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

exports.handleBirthdayResets = async function(interaction, isBirthdayChange) {
    if (!isBirthdayChange) {
        return 10;
    }
    const user = await exports.getUserFromId(interaction.user.id);
    return user.resets - 1;
};
