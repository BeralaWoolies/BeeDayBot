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
} = require('../helpers/birthdayHelpers.js');
const database = require('../schemas/birthday.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addbirthday')
        .setDescription('Register your birthday!')
        .addStringOption(option =>
            option.setName('birthdate')
                .setDescription('Enter the day and month of your birthday in the following format: dd/mm')
                .setRequired(true)
                .setMinLength(5)
                .setMaxLength(5)),
    async execute(interaction) {
        const birthday = interaction.options.getString('birthdate');
        if (!validDayAndMonth(birthday)) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error')
                .setDescription('Invalid birthdate, remember to type birthdate in the following format: **dd/mm**')
                .addFields([
                    { name: 'Example Usage for 4th of April:', value: '`04/04`' },
                ])
                .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.avatarURL() });
            await interaction.reply({
                ephemeral: true,
                embeds: [errorEmbed],
            });
            return;
        }

        const isBirthdayChange = await hasBirthdayRegistered(interaction.user.id);
        const { birthdayMonth, birthdayDay } = parseBirthdayString(birthday);

        // allow leaplings to choose if they want to celebrate birthday on the 28th of February or 1st of March on non-leap years
        const { celebrateBefore, leaplingBirthday } = await handleLeaplingPreference(interaction, birthdayMonth, birthdayDay);
        if (isLeapling(birthdayMonth, birthdayMonth) && celebrateBefore === null && leaplingBirthday === null) {
            await interaction.editReply({
                content: 'You have timed out because you have not selected an option, use the /addbirthday command again to set your birthdate',
                ephemeral: true,
                components: [],
            });
            return;
        }

        let resets = 0;
        if (isBirthdayChange) {
            const user = await database.findOne({ discordId: interaction.user.id }).exec();
            const newResets = user.resets - 1;
            if (newResets >= 0) {
                await database.findOneAndReplace({ discordId: interaction.user.id }, {
                    discordId: interaction.user.id,
                    month: birthdayMonth,
                    day: birthdayDay,
                    ...(isLeapling(birthdayMonth, birthdayDay) && { celebrateBefore: celebrateBefore }),
                    resets: newResets,
                });
                resets = newResets;
            } else {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('Error')
                    .setDescription('You have **0** birthday resets and cannot change your birthday anymore')
                    .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.avatarURL() });
                await interaction.reply({
                    ephemeral: true,
                    embeds: [errorEmbed],
                });
                return;
            }
        } else {
            const baseResets = 10;
            await database.create({
                discordId: interaction.user.id,
                month: birthdayMonth,
                day: birthdayDay,
                ...(isLeapling(birthdayMonth, birthdayDay) && { celebrateBefore: celebrateBefore }),
                resets: baseResets,
            });
            resets = baseResets;
        }

        const description = isLeapling(birthdayMonth, birthdayDay)
            ? `You have set your birthday for the date: **29th of February** and **${leaplingBirthday}** on **non-leap** years`
            : `You have set your birthday for the date: **${formatDate(birthdayMonth, birthdayDay)}**`;
        const successEmbed = new EmbedBuilder()
            .setColor(0x9AFF00)
            .setTitle('🎉 Birthday Confirmation 🎉')
            .setDescription(description)
            .addFields([
                { name: '**Remaining Resets**', value: `${resets}` },
            ])
            .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.avatarURL() });

        if (!isLeapling(birthdayMonth, birthdayDay)) {
            await interaction.reply({
                ephemeral: true,
                embeds: [successEmbed],
            });
        } else {
            await interaction.followUp({
                ephemeral: true,
                embeds: [successEmbed],
            });
        }
        // make sure users setting bday on the day of their bday should also be announced
        if (hasBirthdayToday(await getUserFromId(interaction.user.id))) {
            await announceBirthday(interaction.client, interaction.user.id);
        }
    },
};
