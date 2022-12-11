const { SlashCommandBuilder } = require('discord.js');
const { validDayAndMonth, formatDate } = require('../helpers/dateHelpers.js');
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

        const digits = birthday.split('/').map(digit => parseInt(digit));
        const data = database.getData();
        data.push({
            id: interaction.user.id,
            month: digits[1] - 1,
            day: digits[0],
        });
        database.setData(data);

        const date = formatDate(digits[1] - 1, digits[0]);
        await interaction.reply({
            content: `You have set your birthday for the date: ${date}`,
            ephemeral: true,
        });
    },
};
