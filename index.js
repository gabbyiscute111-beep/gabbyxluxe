

require('dotenv').config();
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

const { Client, Events, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const client = new Client({ 
   intents: [
     GatewayIntentBits.Guilds, 
     GatewayIntentBits.GuildMembers,
     GatewayIntentBits.GuildMessages,
     GatewayIntentBits.MessageContent,
     GatewayIntentBits.GuildMessageReactions,
     GatewayIntentBits.GuildPresences
   ] 
});
console.log('That girl starting...');

// --- Slash Command Handler (only one block, right after client is defined) ---
const path = require('path');
const fs = require('fs');

client.commands = new Map();
const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));
for (const folder of commandFolders) {
   const commandFiles = fs.readdirSync(path.join(__dirname, 'commands', folder)).filter(file => file.endsWith('.js'));
   for (const file of commandFiles) {
      const command = require(`./commands/${folder}/${file}`);
      if (command.data && command.execute) {
         client.commands.set(command.data.name, command);
      }
   }
}

client.on('interactionCreate', async interaction => {
   if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
         await command.execute(interaction);
      } catch (error) {
         console.error(error);
         if (interaction.deferred) {
            await interaction.editReply({ content: '❌ There was an error executing this command.' });
         } else {
            await interaction.reply({ content: '❌ There was an error executing this command.', ephemeral: true });
         }
      }
   } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
      // Route to the vanity-setup command's handleButton if available
      const statusEmbed = client.commands.get('vanity-setup');
      if (statusEmbed && statusEmbed.handleButton) {
         try {
            await statusEmbed.handleButton(interaction);
         } catch (error) {
            console.error(error);
            if (interaction.deferred) {
               await interaction.editReply({ content: '❌ There was an error handling the button.' });
            } else {
               await interaction.reply({ content: '❌ There was an error handling the button.', ephemeral: true });
            }
         }
      }
   } else if (interaction.isModalSubmit()) {
      // Route to the vanity-setup command's handleModal if available
      const statusEmbed = client.commands.get('vanity-setup');
      if (statusEmbed && statusEmbed.handleModal) {
         try {
            await statusEmbed.handleModal(interaction);
         } catch (error) {
            console.error(error);
            if (interaction.deferred) {
               await interaction.editReply({ content: '❌ There was an error handling the modal.' });
            } else {
               await interaction.reply({ content: '❌ There was an error handling the modal.', ephemeral: true });
            }
         }
      }
   }
});

// Connect to MongoDB
// ...existing code...
// Connect to MongoDB
const mongoUri = process.env.MONGODBURI || 'mongodb://localhost:27017/luxenbot';
mongoose.connect(mongoUri, {
   // No longer need useNewUrlParser
}).then(() => {
   console.log('Connected to MongoDB');
}).catch(err => {
   console.error('MongoDB connection error:', err);
});
// STATUS system 

let statusTemplates = [
   {
      name: 'will you come with me?',
      type: ActivityType.Streaming,
      url: 'https://www.twitch.tv/kaicenat'
   },
   {
      name: 'rep /ffvii for our perks !',
      type: ActivityType.Streaming,
      url: 'https://www.twitch.tv/kaicenat'
   },
   {
      name: 'Starting up...',
      type: ActivityType.Watching,
      url: 'https://www.twitch.tv/kaicenat'
   }
];
client.login(token);

client.once(Events.ClientReady, async readyClient => {
   console.log(`Heyy Gabby! ${readyClient.user.tag} is ready and online!`);


   // Set initial member count status immediately
   try {
      const guild = await client.guilds.fetch(guildId);
      const memberCount = guild.memberCount;
      statusTemplates[2].name = `${memberCount} wonderful luxicans !`;
      let random = Math.floor(Math.random() * statusTemplates.length);
      client.user.setActivity(statusTemplates[random]);
   } catch (err) {
      console.error('Error setting initial status:', err);
   }

   // Update status periodically
   setInterval(async () => {
      try {
         const guild = await client.guilds.fetch(guildId);
         const memberCount = guild.memberCount;
         statusTemplates[2].name = `${memberCount} wonderful luxicans !`;
         let random = Math.floor(Math.random() * statusTemplates.length);
         client.user.setActivity(statusTemplates[random]);
      } catch (err) {
         console.error('Error updating status:', err);
      }
   }, 10000);
});

// vanity set up
const Status = require('./Schemas.js/statusSchema'); // Adjust path as needed

client.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
   if (!newPresence || !newPresence.user || !newPresence.guild) return;

   // Find the custom status activity (type 4) for old and new presence
   const getCustomStatus = (presence) => {
      if (!presence || !presence.activities) return null;
      return presence.activities.find(a => a.type === 4 && a.state);
   };
   const oldCustomStatus = getCustomStatus(oldPresence);
   const newCustomStatus = getCustomStatus(newPresence);


   // Fetch the user's status config from DB
   const statusData = await Status.findOne({ userid: newPresence.user.id });
   if (!statusData || !statusData.vanity || !statusData.channel || statusData.enabled === false) return;

   // Check if the custom status matches the user's vanity
   const oldHasVanity = oldCustomStatus && oldCustomStatus.state.toLowerCase().includes(statusData.vanity.toLowerCase());
   const newHasVanity = newCustomStatus && newCustomStatus.state.toLowerCase().includes(statusData.vanity.toLowerCase());
   const roleId = statusData.vanityRole || process.env.VANITY_ROLE_ID;
   let member;
   let roleMention = '';
   try {
      member = await newPresence.guild.members.fetch(newPresence.user.id);
   } catch (e) {
      console.error('Failed to fetch member for vanity role:', e);
   }
   if (roleId) {
      roleMention = `<@&${roleId}>`;
   }

   // Helper to get the role, fetch if not cached
   async function getRole(guild, roleId) {
      let role = guild.roles.cache.get(roleId);
      if (!role) {
         try {
            role = await guild.roles.fetch(roleId);
         } catch (e) {
            // ignore
         }
      }
      return role;
   }

   // Only send embed and add role if vanity is newly detected
   if (!oldHasVanity && newHasVanity) {
      // Build the embed using the user's saved config (status-setup) and replace variables
      const replaceVars = (str) => {
         if (!str) return str;
         return str
            .replace(/{user}/gi, `<@${newPresence.user.id}>`)
            .replace(/{username}/gi, newPresence.user.username)
            .replace(/{serverName}/gi, newPresence.guild.name)
            .replace(/{server_name}/gi, newPresence.guild.name)
            .replace(/{vanity}/gi, statusData.vanity || '')
            .replace(/{role}/gi, roleMention)
            .replace(/{server_avatar}/gi, newPresence.guild.iconURL({ dynamic: true, size: 256 }) || '')
            .replace(/{user_avatar}/gi, newPresence.user.displayAvatarURL({ dynamic: true, size: 256 }) || '');
      };

      const embed = new EmbedBuilder();
      if (statusData.title) embed.setTitle(replaceVars(statusData.title));
      if (statusData.description) embed.setDescription(replaceVars(statusData.description));
      if (statusData.color) embed.setColor(statusData.color);
      if (statusData.footer) embed.setFooter({ text: replaceVars(statusData.footer) });
      if (statusData.timestamp) embed.setTimestamp();
      if (statusData.image) embed.setImage(statusData.image);
      if (statusData.author) {
         const authorObj = { name: replaceVars(statusData.author) };
         if (statusData.authorIcon) authorObj.iconURL = replaceVars(statusData.authorIcon);
         embed.setAuthor(authorObj);
      }
      // fallback if no title/desc
      if (!statusData.title && !statusData.description) {
         embed.setTitle('Vanity Detected!');
         embed.setDescription(`${newPresence.user.tag} set their status to ${statusData.vanity}${roleMention ? ` | ${roleMention}` : ''}`);
      }

      // Send to the configured channel
      const channel = newPresence.guild.channels.cache.get(statusData.channel);
      if (channel && channel.isTextBased()) {
         await channel.send({ embeds: [embed] });
      }

      // Give a role if set in DB, else fallback to env
      if (roleId && member && !member.roles.cache.has(roleId)) {
         const role = await getRole(newPresence.guild, roleId);
         if (!role) {
            console.warn(`Vanity role with ID ${roleId} does not exist in this guild.`);
         } else {
            try {
               await member.roles.add(roleId, 'Vanity detected in status');
            } catch (e) {
               console.error('Failed to add vanity role:', e);
            }
         }
      }
   } else if (oldHasVanity && !newHasVanity) {
      // Remove the role if present (do NOT send an embed)
      if (roleId && member && member.roles.cache.has(roleId)) {
         const role = await getRole(newPresence.guild, roleId);
         if (!role) {
            console.warn(`Vanity role with ID ${roleId} does not exist in this guild.`);
         } else {
            try {
               await member.roles.remove(roleId, 'Vanity removed from status');
            } catch (e) {
               console.error('Failed to remove vanity role:', e);
            }
         }
      }
   }
});