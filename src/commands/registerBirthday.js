const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addbirthday')
		.setDescription('Registers user\'s birthday in the database'),
	async execute(interaction) {
		await interaction.reply('Birthday registered!');
	},
};