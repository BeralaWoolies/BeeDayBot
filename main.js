const fs = require('node:fs');
const CronJob = require('cron').CronJob;
const database = require('./src/database.js');
const {
    Client,
    GatewayIntentBits,
    Events,
    Collection
} = require('discord.js');
const {
    hasBirthdayToday,
    announceBirthday
} = require('./src/helpers/birthdayHelpers.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();

const eventFiles = fs.readdirSync('./src/events').filter(file => file.endsWith('.js'));
console.log('event files found: ', eventFiles);

for (const file of eventFiles) {
    const event = require(`./src/events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
console.log('command files found: ', commandFiles);

for (const file of commandFiles) {
    const command = require(`./src/commands/${file}`);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`Invalid command at location ./src/commands/${file}`);
    }
}

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'There was an error while executing this command!',
            ephemeral: true
        });
    }
});

// Check birthdays every night at midnight
const job = new CronJob(
    '0 0 0 * * *',
    function() {
        const now = new Date();
        const data = database.getData();
        const celebrants = data.filter(user =>
            hasBirthdayToday(now, user.month, user.day)
        );

        if (celebrants.length === 0) {
            return;
        }
        celebrants.forEach(celebrant => {
            announceBirthday(client, celebrant.id);
        });
        console.log('new bday');
    },
    null,
    false,
    'Australia/Sydney'
);
job.start();

client.login(process.env.DISCORD_TOKEN);
