const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Welcome = require('../../Schemas.js/welcomeSchema');
const embedCommand = require('./embed.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welc_msg')
        .setDescription('Send and customize your welc message !')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('msg')
                .setDescription('The welcome message to send (supports variables)')
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option.setName('embed')
                .setDescription('Send with embed from welcome embed?')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            await interaction.deferReply();
            const welcomeMessage = interaction.options.getString('msg');
            const useEmbed = interaction.options.getBoolean('embed');
            let welcomeData = await Welcome.findOne({ guildId: interaction.guild.id }) || new Welcome({ guildId: interaction.guild.id });
            // Save the message for later use
            welcomeData.welcomeMessage = welcomeMessage;
            await welcomeData.save();
            // Replace variables
            const member = interaction.member || interaction.user;
            const messageText = (welcomeMessage || `<@${member.id}> Welcome to Luxen! Stay awhile`)
                .replace(/{user}/gi, `<@${member.id}>`)
                .replace(/{serverName}|{server_name}/gi, interaction.guild.name)
                .replace(/{memberCount}|{member_count}/gi, interaction.guild.memberCount)
                .replace(/{username}|{user_name}/gi, member.user ? member.user.username : member.username);
            if (useEmbed) {
                // Use embed.js logic to build the embed
                let safeColor = welcomeData.color;
                if (!safeColor || typeof safeColor !== 'string' || !safeColor.startsWith('#') || safeColor.length !== 7) {
                    safeColor = "#26160B";
                }
                let desc = (welcomeData.description || "Click the buttons to customize your welcome message :3 !")
                    .replace(/{user}/gi, `<@${member.id}>`)
                    .replace(/{serverName}|{server_name}/gi, interaction.guild.name)
                    .replace(/{memberCount}|{member_count}/gi, interaction.guild.memberCount)
                    .replace(/{username}|{user_name}/gi, member.user ? member.user.username : member.username);
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setTitle(welcomeData.title || "welcome to the server!")
                    .setDescription(desc)
                    .setColor(safeColor)
                    .setFooter({ text: 'Welcome!', iconURL: interaction.guild.iconURL() });
                if (welcomeData.thumbnail) embed.setThumbnail(welcomeData.thumbnail);
                if (welcomeData.image) embed.setImage(welcomeData.image);
                if (welcomeData.timestamp) embed.setTimestamp();
                if (welcomeData.footer) embed.setFooter({ text: welcomeData.footer.replace('{memberCount}', interaction.guild.memberCount), iconURL: interaction.guild.iconURL() });
                if (welcomeData.authorText || welcomeData.authorImage) {
                    embed.setAuthor({
                        name: welcomeData.authorText ? welcomeData.authorText.replace(/{username}|{user_name}/gi, member.user ? member.user.username : member.username) : (member.user ? member.user.username : member.username),
                        iconURL: welcomeData.authorImage || (member.user ? member.user.displayAvatarURL() : member.displayAvatarURL())
                    });
                }
                await interaction.editReply({
                    content: messageText,
                    embeds: [embed]
                });
            } else {
                await interaction.editReply({
                    content: messageText
                });
            }
        } catch (error) {
            console.error('Error in welc-message command:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply('There was an error while executing this command.');
            } else {
                await interaction.reply('There was an error while executing this command.');
            }
        }
    }
};
