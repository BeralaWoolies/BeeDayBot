const { SlashCommandBuilder } = require('discord.js');
const { formatDate } = require('../helpers/dateHelpers.js');
const database = require(`../database.js`);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkbirthday')
        .setDescription('Check your set birthday!'),
    async execute(interaction) {
        const discordId = interaction.user.id;
        const data = database.getData();

        const filteredUsers = data.filter(user => user.id === discordId);
        if (filteredUsers.length === 0) {
            await interaction.reply({
				content: 'You have not set your birthday, use the /addbirthday command to set your birthday',
				ephemeral: true,
			});
            return;
        }

        const user = filteredUsers[0];
        const date = formatDate(user.month, user.day);
        await interaction.reply({
            content: `You birthday is currently set on the ${date}`,
            ephemeral: true,
        });
    },
};