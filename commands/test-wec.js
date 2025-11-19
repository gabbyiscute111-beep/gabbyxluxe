
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Welcome = require('../../Schemas.js/welcomeSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test-welc')
        .setDescription('Send a welcome message when a member joins.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            const member = interaction.member || interaction.user;
            const welcomeData = await Welcome.findOne({ guildId: interaction.guild.id });

            if (!welcomeData || !welcomeData.enabled || !welcomeData.welcomeChannel) {
                await interaction.editReply('Welcome system is not enabled or not configured.');
                return;
            }

            const channel = interaction.guild.channels.cache.get(welcomeData.welcomeChannel);
            if (!channel) {
                await interaction.editReply('Welcome channel not found.');
                return;
            }

            // Variable replacement function
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

            // Build description with variables
            const description = replaceVars(welcomeData.description || '');

            // Build welcome message with variables
            const welcomeMessage = replaceVars(welcomeData.welcomeMessage || `<@${member.id}> Welcome to Luxen! Stay awhile`);

            const embed = new EmbedBuilder()
                .setTitle(replaceVars(welcomeData.title) || 'Welcome!')
                .setDescription(description)
                .setColor(welcomeData.color || '#26160B');

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

            await channel.send({
                content: welcomeMessage,
                embeds: [embed]
            });

            await interaction.editReply('Welcome message sent!');
        } catch (error) {
            console.error('Error in memberAdd command:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply('There was an error while executing this command.');
            } else {
                await interaction.reply('There was an error while executing this command.');
            }
        }
    }
};
