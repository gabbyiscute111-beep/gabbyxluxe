const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

// Recursively load command data from all command files in subfolders
const commands = [];
function getAllCommandFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = `${dir}/${file}`;
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllCommandFiles(filePath));
        } else if (file.endsWith('.js')) {
            results.push(filePath);
        }
    });
    return results;
}

const commandFiles = getAllCommandFiles('./commands');
for (const file of commandFiles) {
    const command = require(file);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${file} is missing a required "data" or "execute" property.`);
    }
}

const rest = new REST({ version: '10' }).setToken(token);

// Register commands for a specific guild (instant update)
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();