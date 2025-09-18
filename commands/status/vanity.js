const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Status = require('../../Schemas.js/statusSchema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vanity')
        .setDescription('Set or update your vanity !')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The vanity to track (dont add the /)')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to assign')
                .setRequired(false)
        )
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send vanity embed')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const vanity = interaction.options.getString('name');
            const role = interaction.options.getRole('role');
            const channel = interaction.options.getChannel('channel');
            let statusData = await Status.findOne({ userid: interaction.user.id });
            if (!statusData) {
                statusData = new Status({ userid: interaction.user.id, status: 'active' });
            }
            if (vanity !== null && vanity !== undefined) statusData.vanity = vanity;
            if (role) statusData.vanityRole = role.id;
            if (channel) statusData.channel = channel.id;
            await statusData.save();
            let replyMsg = '';
            if (vanity) replyMsg = `Your vanity is now set to${vanity ? ` /${vanity}` : ''}!`;
            if (role) replyMsg += `\nRole to assign: <@&${role.id}>`;
            if (channel) replyMsg += `\nChannel to send embed: <#${channel.id}>`;
            await interaction.reply({ content: replyMsg, ephemeral: true });
        } catch (err) {
            console.error('Error in /vanity:', err);
            if (interaction.deferred) {
                await interaction.editReply({ content: '❌ An error occurred while processing your request.' });
            } else {
                await interaction.reply({ content: '❌ An error occurred while processing your request.', ephemeral: true });
            }
        }
    }
};