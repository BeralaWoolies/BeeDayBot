const { SlashCommandBuilder } = require('discord.js');
const { formatDate } = require('../helpers/dateHelpers.js');
const {
    hasBirthdayRegistered,
    getUserFromId,
    isLeapling,
} = require('../helpers/birthdayHelpers.js');

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
        const user = getUserFromId(interaction.user.id);
        if (!isLeapling(user.month, user.day)) {
            await interaction.reply({
                content: `You birthday is currently set on the ${formatDate(user.month, user.day)}`,
                ephemeral: true,
            });
        } else {
            const nonLeapYearDate = user.celebrateBefore ? '28th of February' : '1st of March';
            await interaction.reply({
                content: `You birthday is currently set on the 29th of February and ${nonLeapYearDate} on non-leap years`,
                ephemeral: true,
            });
        }
    },
};
