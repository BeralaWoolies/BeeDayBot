const {
    SlashCommandBuilder,
    EmbedBuilder,
} = require('discord.js');
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
        // return if user is trying to check their birthday before setting it
        if (!(await hasBirthdayRegistered(interaction.user.id))) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Error: No Set Birthday')
                .setDescription('You have not set your birthday, use the **/addbirthday** command to set your birthday')
                .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.avatarURL() });
            await interaction.reply({
                ephemeral: true,
                embeds: [errorEmbed],
            });
            return;
        }

        // Retrieve user's birthday information
        const user = await getUserFromId(interaction.user.id);
        const leapling = isLeapling(user.month, user.day);
        const nonLeapYearDate = user.celebrateBefore ? '28th of February' : '1st of March';

        // generate dynamic description for embed based on if the user was a leapling or not
        const description = (leapling === true)
            ? `Your birthday is currently set for the date: **29th of February** and **${nonLeapYearDate}** during **non-leap** years`
            : `Your birthday is currently set for the date: **${formatDate(user.month, user.day)}**`;
        const successEmbed = new EmbedBuilder()
            .setColor(0xFF9500)
            .setTitle('🎂 Birthday Check 🎂')
            .setDescription(description)
            .addFields([
                { name: '**Remaining birthday resets**', value: `${user.resets}` },
            ])
            .setAuthor({ name: interaction.client.user.username, iconURL: interaction.client.user.avatarURL() });
        await interaction.reply({
            ephemeral: true,
            embeds: [successEmbed],
        });
    },
};
