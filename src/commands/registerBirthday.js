const { SlashCommandBuilder } = require('discord.js');
const {
    validDayAndMonth,
    formatDate
} = require('../helpers/dateHelpers.js');
const {
    hasBirthdayToday,
    announceBirthday,
    hasBirthdayRegistered,
    parseBirthdayString
} = require('../helpers/birthdayHelpers.js');
const database = require(`../database.js`);

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
            await interaction.reply({
                content: `Invalid birthdate, remember to type birthdate in the following format: dd/mm`,
                ephemeral: true,
            });
            return;
        }
        if (hasBirthdayRegistered(interaction.user.id)) {
            await interaction.reply({
                content: `You have already set a birthdate, use the /changebirthday command to change your birthday!`,
                ephemeral: true,
            });
            return;
        }

        const { birthdayMonth, birthdayDay } = parseBirthdayString(birthday);
        const data = database.getData();
        data.push({
            id: interaction.user.id,
            month: birthdayMonth,
            day: birthdayDay,
        });
        database.setData(data);
        // make sure users setting bday on the day of their bday should also be
        // announced
        if (hasBirthdayToday(birthdayMonth, birthdayDay)) {
            announceBirthday(interaction.client, interaction.user.id);
        }
        await interaction.reply({
            content: `You have set your birthday for the date: ${formatDate(birthdayMonth, birthdayDay)}`,
            ephemeral: true,
        });
    },
};
