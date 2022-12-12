const { SlashCommandBuilder } = require('discord.js');
const { formatDate } = require('../helpers/dateHelpers.js');
const { hasBirthdayRegistered, getBirthdayFromId } = require('../helpers/birthdayHelpers.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkbirthday')
        .setDescription('Check your set birthday!'),
    async execute(interaction) {
        if (!hasBirthdayRegistered(interaction.user.id)) {
            await interaction.reply({
                content: 'You have not set your birthday, use the /addbirthday command to set your birthday',
                ephemeral: true,
            });
            return;
        }
        const user = getBirthdayFromId(interaction.user.id);
        await interaction.reply({
            content: `You birthday is currently set on the ${formatDate(user.month, user.day)}`,
            ephemeral: true,
        });
    },
};
