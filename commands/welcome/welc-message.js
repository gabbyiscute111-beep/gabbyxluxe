const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Welcome = require('../../Schemas.js/welcomeSchema');
const embedCommand = require('./welcEmbed.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welc-msg')
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
            // Variable replacement function
            const member = interaction.member || interaction.user;
            const replaceVars = (str) => {
                if (!str) return str;
                return str
                    .replace(/{user}/gi, `<@${member.id}>`)
                    .replace(/{username}/gi, member.user ? member.user.username : member.username)
                    .replace(/{serverName}/gi, interaction.guild.name)
                    .replace(/{server_name}/gi, interaction.guild.name)
                    .replace(/{memberCount}/gi, interaction.guild.memberCount.toString())
                    .replace(/{server_avatar}/gi, interaction.guild.iconURL({ dynamic: true, size: 256 }) || '')
                    .replace(/{user_avatar}/gi, member.user ? member.user.displayAvatarURL({ dynamic: true, size: 256 }) : member.displayAvatarURL({ dynamic: true, size: 256 }));
            };
            
            const messageText = replaceVars(welcomeMessage || `<@${member.id}> Welcome to Luxen! Stay awhile`);
            if (useEmbed) {
                // Use embed.js logic to build the embed
                let safeColor = welcomeData.color;
                if (!safeColor || typeof safeColor !== 'string' || !safeColor.startsWith('#') || safeColor.length !== 7) {
                    safeColor = "#26160B";
                }
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setTitle(replaceVars(welcomeData.title) || "welcome to the server!")
                    .setDescription(replaceVars(welcomeData.description) || "Click the buttons to customize your welcome message :3 !")
                    .setColor(safeColor);

                // Handle thumbnail with variable replacement
                if (welcomeData.thumbnail) {
                    const thumbnailUrl = replaceVars(welcomeData.thumbnail);
                    if (thumbnailUrl && thumbnailUrl.startsWith('http')) {
                        embed.setThumbnail(thumbnailUrl);
                    }
                }

                // Handle image with variable replacement
                if (welcomeData.image) {
                    const imageUrl = replaceVars(welcomeData.image);
                    if (imageUrl && imageUrl.startsWith('http')) {
                        embed.setImage(imageUrl);
                    }
                }

                if (welcomeData.timestamp) embed.setTimestamp();

                // Handle footer with variable replacement
                if (welcomeData.footer) {
                    const footerObj = { text: replaceVars(welcomeData.footer) };
                    if (welcomeData.footerIcon) {
                        const footerIconUrl = replaceVars(welcomeData.footerIcon);
                        if (footerIconUrl && footerIconUrl.startsWith('http')) {
                            footerObj.iconURL = footerIconUrl;
                        }
                    }
                    embed.setFooter(footerObj);
                } else {
                    embed.setFooter({ text: 'Welcome!', iconURL: interaction.guild.iconURL() });
                }

                // Set author if present  
                if (welcomeData.author || welcomeData.authorIcon) {
                    const authorObj = {
                        name: replaceVars(welcomeData.author) || (member.user ? member.user.username : member.username)
                    };
                    
                    if (welcomeData.authorIcon) {
                        const authorIconUrl = replaceVars(welcomeData.authorIcon);
                        if (authorIconUrl && authorIconUrl.startsWith('http')) {
                            authorObj.iconURL = authorIconUrl;
                        }
                    } else {
                        authorObj.iconURL = member.user ? member.user.displayAvatarURL() : member.displayAvatarURL();
                    }
                    
                    embed.setAuthor(authorObj);
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
