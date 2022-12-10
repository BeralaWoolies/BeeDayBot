const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('checkbirthday')
		.setDescription('Shows registered birthday associated with user'),
	async execute(interaction) {
		await interaction.reply('Retrieving associated birthday');
	},
};