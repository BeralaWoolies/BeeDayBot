const { SlashCommandBuilder } = require('discord.js');
const database = require('../database.js');
const {
    validDayAndMonth,
    formatDate
} = require('../helpers/dateHelpers.js');
const {
    hasBirthdayToday,
    announceBirthday,
    hasBirthdayRegistered,
    parseBirthdayString,
    isIdenticalBirthday
} = require('../helpers/birthdayHelpers.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('changebirthday')
        .setDescription('change your current birthday')
        .addStringOption(option =>
            option.setName('birthdate')
                .setDescription('Enter the new day and month of your birthday in the following format: dd/mm')
                .setRequired(true)
                .setMinLength(5)
                .setMaxLength(5)),
    async execute(interaction) {
        const birthday = interaction.options.getString('birthdate');
        if (!validDayAndMonth(birthday)) {
            await interaction.reply({
                content: `Invalid birthdate, remember to type birthdate in the following format: dd/mm`,
                ephemeral: true,
            });
            return;
        }
        if (!hasBirthdayRegistered(interaction.user.id)) {
            await interaction.reply({
                content: 'You do not have a current set birthdate, use the /addbirthday command to set your birthday',
                ephemeral: true,
            });
            return;
        }
        if (isIdenticalBirthday(interaction.user.id, birthday)) {
            await interaction.reply({
                content: 'Invalid birthdate, your new birthday is the same as your current birthday',
                ephemeral: true,
            });
            return;
        }
        const { birthdayMonth, birthdayDay } = parseBirthdayString(birthday);
        const data = database.getData();
        data.forEach(user => {
            if (user.id === interaction.user.id) {
                user.month = birthdayMonth;
                user.day = birthdayDay;
            }
        });
        database.setData(data);

        const now = new Date();
        // make sure users changing bday on the day of their bday should also be
        // announced
        if (hasBirthdayToday(now, birthdayMonth, birthdayDay)) {
            announceBirthday(interaction.client, interaction.user.id);
        }
        const date = formatDate(birthdayMonth, birthdayDay);
        await interaction.reply({
            content: `You have set your new birthday for the date: ${date}`,
            ephemeral: true,
        });
    },
};
