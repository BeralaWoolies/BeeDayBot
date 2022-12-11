const { SlashCommandBuilder, CommandInteractionOptionResolver } = require('discord.js');
const database = require(`../database.js`);

const daysInAMonthLookUp = {
	January: 31,
	February: 29,
	March: 31,
	April: 30,
	May: 31,
	June: 30,
	July: 31,
	August: 31,
	September: 30,
	October: 31,
	November: 30,
	December: 31,
}

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
		const discordId = interaction.user.id;
		const discordUsername = interaction.user.username;
		const discordTag = interaction.user.tag;
		console.log(`Recipient Discord Id: ${discordId}`);
		console.log(`Recipient Discord Username: ${discordUsername}`);
		console.log(`Recipient Discord Tag: ${discordTag}`);
		console.log(interaction.user)

		const birthday = interaction.options.getString('birthdate');
		console.log(`Birthday input: ${birthday}`);
		console.log('Birthday digits: ');

		if (!validDayAndMonth(birthday)) {
			await interaction.reply({
				content: `Invalid birthdate, remember to type birthdate in the following format: dd/mm`,
				ephemeral: true,
			});
			return;
		}

		const digits = birthday.split('/').map(digit => parseInt(digit));
		console.log(digits);
		const data = database.getData();
		data.push({
			id: interaction.user.id,
			month: digits[1] - 1,
			day: digits[0],
		});

		console.log(data);
		console.log(`Registered birthday is on ${digits[0]}/${digits[1]}`);
		await interaction.reply({
			content: `You have set your birthday for the date: ${birthday}`,
			ephemeral: true,
		});
	},
};

function validDayAndMonth(date) {
	// Check if date is in the following format: dd/mm
	if (/[0-9]{2}\/[0-9]{2}/g.test(date)) {
		const digits = date.split('/').map(digit => parseInt(digit));
		// mm must be in the range 1-12
		if (digits[1] < 1 || digits[1] > 12) {
			return false;
		}
		// dd must be in the range 1-29/30/31
		const key = Object.keys(daysInAMonthLookUp)[digits[1] - 1];
		if (digits[0] < 1 || digits[0] > daysInAMonthLookUp[key]) {
			console.log(`${key} does not have ${digits[0]} days`);
			return false;
		}
		return true;
	}
	return false;
}