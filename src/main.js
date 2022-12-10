const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const dotenv = require('dotenv').config();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
console.log(`commandsPath: ${commandsPath}`);
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
console.log('command files found: ', commandFiles);

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	console.log(`filePath: ${filePath}`);
	const command = require(filePath);
	console.log(command)
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, msg => {
	if(msg.author.id === client.user.id) {
		return;
	}
	msg.reply(`Hello!`);
});

client.login(process.env.DISCORD_TOKEN);