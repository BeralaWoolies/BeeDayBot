const {
    SlashCommandBuilder,
    EmbedBuilder,
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Confused? use me!'),
    async execute(interaction) {
        const helpEmbed = new EmbedBuilder()
            .setColor(0x871D76)
            .setAuthor({ name: 'BeeDayBot Commands', iconURL: interaction.client.user.avatarURL() })
            .addFields([
                {
                    name: '`/addbirthday`',
                    value: 'Set your birthday with this command',
                },
                {
                    name: '`/checkbirthday`',
                    value: 'Check your set birthday with this command',
                }
            ])
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.avatarURL(),
            });
        await interaction.reply({
            embeds: [helpEmbed],
        });
    },
};
