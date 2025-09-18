
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Welcome = require('../../Schemas.js/welcomeSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test_welc')
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

            // Build description with variables
            const description = (welcomeData.description || '')
                .replace(/{user}/gi, `<@${member.id}>`)
                .replace(/{serverName}|{server_name}/gi, interaction.guild.name)
                .replace(/{memberCount}|{member_count}/gi, interaction.guild.memberCount)
                .replace(/{username}|{user_name}/gi, member.user ? member.user.username : member.username);

            // Build welcome message with variables
            const welcomeMessage = (welcomeData.welcomeMessage || `<@${member.id}> Welcome to Luxen! Stay awhile`)
                .replace(/{user}/gi, `<@${member.id}>`)
                .replace(/{serverName}|{server_name}/gi, interaction.guild.name)
                .replace(/{memberCount}|{member_count}/gi, interaction.guild.memberCount)
                .replace(/{username}|{user_name}/gi, member.user ? member.user.username : member.username);

            const embed = new EmbedBuilder()
                .setTitle(welcomeData.title || 'Welcome!')
                .setDescription(description)
                .setColor(welcomeData.color || '#26160B');

            if (welcomeData.thumbnail) embed.setThumbnail(welcomeData.thumbnail);
            if (welcomeData.image) embed.setImage(welcomeData.image);
            if (welcomeData.timestamp) embed.setTimestamp();
            if (welcomeData.footer) embed.setFooter({ text: welcomeData.footer });
            // Set author if present
            if (welcomeData.authorText || welcomeData.authorImage) {
                embed.setAuthor({
                    name: welcomeData.authorText ? welcomeData.authorText.replace(/{username}|{user_name}/gi, member.user ? member.user.username : member.username) : (member.user ? member.user.username : member.username),
                    iconURL: welcomeData.authorImage || (member.user ? member.user.displayAvatarURL() : member.displayAvatarURL())
                });
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
