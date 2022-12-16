const { SlashCommandBuilder } = require('discord.js');
const {
    validDayAndMonth,
    formatDate,
} = require('../helpers/dateHelpers.js');
const {
    hasBirthdayToday,
    announceBirthday,
    hasBirthdayRegistered,
    parseBirthdayString,
    isIdenticalBirthday,
    isLeapling,
    handleLeaplingPreference,
    getUserFromId,
} = require('../helpers/birthdayHelpers.js');
const database = require('../schemas/birthday.js');

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
        if (await !hasBirthdayRegistered(interaction.user.id)) {
            await interaction.reply({
                content: 'You do not have a current set birthdate, use the /addbirthday command to set your birthday',
                ephemeral: true,
            });
            return;
        }
        if (await isIdenticalBirthday(interaction.user.id, birthday)) {
            await interaction.reply({
                content: 'Invalid birthdate, your new birthday is the same as your current birthday',
                ephemeral: true,
            });
            return;
        }

        const { birthdayMonth, birthdayDay } = parseBirthdayString(birthday);

        // allow leaplings to choose if they want to celebrate birthday on the 28th of February or 1st of March on non-leap years
        const { celebrateBefore, leaplingBirthday } = await handleLeaplingPreference(interaction, birthdayMonth, birthdayDay);
        if (isLeapling(birthdayMonth, birthdayDay) && celebrateBefore === null && leaplingBirthday === null) {
            await interaction.editReply({
                content: 'You have timed out because you have not selected an option, use the /addbirthday command again to set your birthdate',
                ephemeral: true,
                components: [],
            });
            return;
        }

        await database.findOneAndReplace({ discordId: interaction.user.id }, {
            discordId: interaction.user.id,
            month: birthdayMonth,
            day: birthdayDay,
            ...(isLeapling(birthdayMonth, birthdayDay) && { celebrateBefore: celebrateBefore }),
        });

        if (!isLeapling(birthdayMonth, birthdayDay)) {
            await interaction.reply({
                content: `You have set your new birthday for the date: ${formatDate(birthdayMonth, birthdayDay)}`,
                ephemeral: true,
            });
        } else {
            await interaction.followUp({
                content: `You have set your new birthday for the date: 29th of February and ${leaplingBirthday} on non-leap years`,
                ephemeral: true,
            });
        }
        // make sure users changing bday on the day of their bday should also be announced
        if (hasBirthdayToday(await getUserFromId(interaction.user.id))) {
            announceBirthday(interaction.client, interaction.user.id);
        }
    },
};
