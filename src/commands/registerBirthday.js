const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {
    validDayAndMonth,
    formatDate,
} = require('../helpers/dateHelpers.js');
const {
    hasBirthdayToday,
    announceBirthday,
    hasBirthdayRegistered,
    parseBirthdayString,
    isLeapling,
    handleLeaplingPreference,
    getUserFromId,
    handleBirthdayResets,
} = require('../helpers/birthdayHelpers.js');
const {
    isCurrentlyServing,
    serve,
    finishServing,
} = require('../helpers/serveHelpers.js');
const database = require('../schemas/birthday.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addbirthday')
        .setDescription('Set your birthday!')
        .addStringOption(option =>
            option.setName('birthdate')
                .setDescription('Enter the day and month of your birthday in the following format: dd/mm')
                .setRequired(true)
                .setMinLength(5)
                .setMaxLength(5)),
    async execute(interaction) {
        const birthday = interaction.options.getString('birthdate');

        // return if user is being served currently
        if (isCurrentlyServing(interaction.user.id)) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error: /addbirthday is currently running')
                .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.avatarURL() });
            await interaction.reply({
                ephemeral: true,
                embeds: [errorEmbed],
            });
            return;
        }

        // return if birthday is invalid
        if (!validDayAndMonth(birthday)) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error: Invalid Birthdate')
                .setDescription('Remember to type birthdate in the following format: **dd/mm**')
                .addFields([
                    {
                        name: 'Example Usage for 4th of April:',
                        value: '`04/04`'
                    },
                ])
                .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.avatarURL() });
            await interaction.reply({
                ephemeral: true,
                embeds: [errorEmbed],
            });
            return;
        }

        // return if user has no more remaining birthday resets
        const isBirthdayChange = await hasBirthdayRegistered(interaction.user.id);
        const birthdayResets = await handleBirthdayResets(interaction, isBirthdayChange);
        if (birthdayResets < 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error: No More Birthday Resets')
                .setDescription('You have **0** birthday resets and cannot change your birthday anymore')
                .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.avatarURL() });
            await interaction.reply({
                ephemeral: true,
                embeds: [errorEmbed],
            });
            return;
        }

        // serve an instance of the user's /addbirthday request
        serve(interaction.user.id);
        const { birthdayMonth, birthdayDay } = parseBirthdayString(birthday);

        // allow leaplings to choose if they want to celebrate their birthday on the 28th of February or 1st of March on non-leap years
        const leapling = isLeapling(birthdayMonth, birthdayDay);
        const { celebrateBefore, leaplingBirthday } = await handleLeaplingPreference(interaction, birthdayMonth, birthdayDay);
        if (leapling && celebrateBefore === null && leaplingBirthday === null) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error: Timed Out')
                .setDescription('You have not selected an option, use the **/addbirthday** command again to set your birthdate')
                .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.avatarURL() });
            await interaction.editReply({
                ephemeral: true,
                components: [],
                embeds: [errorEmbed],
            });
            finishServing(interaction.user.id);
            return;
        }

        // change birthday or create new one for user
        if (isBirthdayChange && birthdayResets >= 0) {
            await database.findOneAndReplace({ discordId: interaction.user.id }, {
                discordId: interaction.user.id,
                month: birthdayMonth,
                day: birthdayDay,
                ...(leapling && { celebrateBefore: celebrateBefore }),
                resets: birthdayResets,
            });
        } else {
            await database.create({
                discordId: interaction.user.id,
                month: birthdayMonth,
                day: birthdayDay,
                ...(leapling && { celebrateBefore: celebrateBefore }),
                resets: birthdayResets,
            });
        }

        // generate dynamic description for embed based on if the user was a leapling or not
        const description = (leapling === true)
            ? `You have set your birthday for the date: **29th of February** and **${leaplingBirthday}** on **non-leap** years`
            : `You have set your birthday for the date: **${formatDate(birthdayMonth, birthdayDay)}**`;
        const successEmbed = new EmbedBuilder()
            .setColor(0x9AFF00)
            .setTitle('🎉 Birthday Confirmation 🎉')
            .setDescription(description)
            .addFields([
                {
                    name: '**Remaining birthday resets**',
                    value: `${birthdayResets}`
                },
            ])
            .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.avatarURL() });
        if (leapling) {
            await interaction.followUp({
                ephemeral: true,
                embeds: [successEmbed],
            });
        } else {
            await interaction.reply({
                ephemeral: true,
                embeds: [successEmbed],
            });
        }

        // make sure users setting bday on the day of their bday should also be announced
        if (hasBirthdayToday(await getUserFromId(interaction.user.id))) {
            await announceBirthday(interaction.client, interaction.user.id);
        }
        finishServing(interaction.user.id);
    },
};
