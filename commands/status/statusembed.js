
const { blockQuote, bold, italic, quote, spoiler, strikethrough, underline, subtext } = require('discord.js');

const {
    Colors,
    PermissionFlagsBits,
    EmbedBuilder,
    SlashCommandBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder
} = require('discord.js');
const Status = require('../../Schemas.js/statusSchema');

// Export as a Discord.js command module

module.exports = {
    handleModal: async function(interaction) {
        // Only handle our modals

        if (!interaction.customId.startsWith('status_')) return;
        const statusData = await Status.findOne({ userid: interaction.user.id }) || new Status({ userid: interaction.user.id });

        // Update fields - save if filled, remove if empty
        if (interaction.customId === 'status_basicinfo_modal') {
            const title = interaction.fields.getTextInputValue('status_title');
            const description = interaction.fields.getTextInputValue('status_description');
            const color = interaction.fields.getTextInputValue('status_color');
            
            // Save or remove title
            statusData.title = title.trim() || undefined;
            // Save or remove description  
            statusData.description = description.trim() || undefined;
            // Save or remove color
            statusData.color = color.trim() || undefined;
            
            await statusData.save();
        } else if (interaction.customId === 'status_author_modal') {
            const author = interaction.fields.getTextInputValue('status_author_name');
            const authorIcon = interaction.fields.getTextInputValue('status_author_url');
            
            // Save or remove author
            statusData.author = author.trim() || undefined;
            // Save or remove author icon
            statusData.authorIcon = authorIcon.trim() || undefined;
            
            await statusData.save();
        } else if (interaction.customId === 'status_footer_modal') {
            const footer = interaction.fields.getTextInputValue('status_footer_text');
            
            // Save or remove footer
            statusData.footer = footer.trim() || undefined;
            // Optionally, you could store footerIcon in a new field if you want to use it
            
            await statusData.save();
        } else if (interaction.customId === 'status_images_modal') {
            const image = interaction.fields.getTextInputValue('status_big_image');
            
            // Save or remove image
            statusData.image = image.trim() || undefined;
            // Optionally, you could store thumbnail in a new field if you want to use it
            
            await statusData.save();
        }

        // Rebuild the embed and buttons
        // Variable replacement for preview
        const replaceVars = (str) => {
            if (!str) return str;
            return str
                .replace(/{user}/gi, `<@${interaction.user.id}>`)
                .replace(/{username}/gi, interaction.user.username)
                .replace(/{serverName}/gi, interaction.guild.name)
                .replace(/{server_name}/gi, interaction.guild.name)
                .replace(/{vanity}/gi, statusData.vanity || 'your-vanity')
                .replace(/{role}/gi, statusData.vanityRole ? `<@&${statusData.vanityRole}>` : '@YourRole')
                .replace(/{server_avatar}/gi, interaction.guild.iconURL({ dynamic: true, size: 256 }) || '')
                .replace(/{user_avatar}/gi, interaction.user.displayAvatarURL({ dynamic: true, size: 256 }) || '');
        };

        const embed = new EmbedBuilder()
            .setTitle(statusData.title || 'Vanity Embed Setup')
            .setDescription(statusData.description || 'Use the buttons below to customize your vanity embed!\nYou can set the title, description, color, images, author, footer, timestamp, and channel. Once you are done, you can enable or disable the embed.')
            .setColor(statusData.color || Colors.Greyple);
        if (statusData.footer) embed.setFooter({ text: replaceVars(statusData.footer) });
        if (statusData.timestamp) embed.setTimestamp();
        if (statusData.image) embed.setImage(statusData.image);
        if (statusData.author) {
            const authorObj = { name: replaceVars(statusData.author) };
            if (statusData.authorIcon) authorObj.iconURL = replaceVars(statusData.authorIcon);
            embed.setAuthor(authorObj);
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('status_basicinfo')
                .setLabel('basics (title, description, color)')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('status_images')
                .setLabel('images (big image, thumbnail)')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('status_author')
                .setLabel('author (name, icon)')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('status_variables')
                .setLabel('variables')
                .setStyle(ButtonStyle.Success)
        );

        const buttons2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('status_footer')
                .setLabel('footer (text, icon)')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('status_timestamp')
                .setLabel('timestamp')
                .setStyle(statusData.timestamp ? ButtonStyle.Success : ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('status_enable')
                .setLabel(statusData.enabled ? 'Disable' : 'Enable')
                .setStyle(statusData.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
        );

        await interaction.update({
            embeds: [embed],
            components: [row, buttons2],
        });
    },
    data: new SlashCommandBuilder()
        .setName('vanity-setup')
        .setDescription('Setup your vanity embed!')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();
        try {
            let statusData;
            try {
                statusData = await Status.findOne({ userid: interaction.user.id }) || new Status({ userid: interaction.user.id });
            } catch (e) {
                statusData = { title: '', description: '', footer: '', timestamp: false, image: '', author: '', enabled: false };
            }

            const embed = new EmbedBuilder()
                .setTitle(statusData.title || 'Vanity Embed Setup')
                .setDescription(statusData.description || 'Use the buttons below to customize your vanity embed!\nYou can set the title, description, color, images, author, footer, timestamp, and channel. Once you are done, you can enable or disable the embed.')
                .setColor(statusData.color || Colors.Greyple);
            if (statusData.footer) embed.setFooter({ text: statusData.footer });
            if (statusData.timestamp) embed.setTimestamp();
            if (statusData.image) embed.setImage(statusData.image);
            if (statusData.author) embed.setAuthor({ name: statusData.author });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('status_basicinfo')
                    .setLabel('basics (title, description, color)')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('status_images')
                    .setLabel('images (big image, thumbnail)')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('status_author')
                    .setLabel('author (name, icon)')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('status_variables')
                    .setLabel('variables')
                    .setStyle(ButtonStyle.Success)
            );

            const buttons2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('status_footer')
                    .setLabel('footer (text, icon)')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('status_timestamp')
                    .setLabel('timestamp')
                    .setStyle(statusData.timestamp ? ButtonStyle.Success : ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('status_enable')
                    .setLabel(statusData.enabled ? 'Disable' : 'Enable')
                    .setStyle(statusData.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            );

            await interaction.editReply({
                embeds: [embed],
                components: [row, buttons2],
            });
        } catch (err) {
            console.error('Error in /status-setup:', err);
            if (interaction.deferred) {
                await interaction.editReply({ content: '❌ An error occurred while processing your request. Please try again later.', embeds: [], components: [] });
            } else {
                await interaction.reply({ content: '❌ An error occurred while processing your request. Please try again later.', ephemeral: true });
            }
        }
    },

    async handleButton(interaction) {
        console.log('Button/Select customId:', interaction.customId);
        // Select channel button and select menu logic removed

        const statusData = await Status.findOne({ userid: interaction.user.id }) || new Status({ userid: interaction.user.id });
        switch (interaction.customId) {
            case 'status_basicinfo': {
                const modal = new ModalBuilder()
                    .setCustomId('status_basicinfo_modal')
                    .setTitle('Set your main Info');
                const title = new TextInputBuilder()
                    .setCustomId('status_title')
                    .setLabel('Title')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
                    .setValue(statusData.title || '');
                const description = new TextInputBuilder()
                    .setCustomId('status_description')
                    .setLabel('Description')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false)
                    .setValue(statusData.description || '');
                const color = new TextInputBuilder()
                    .setCustomId('status_color')
                    .setLabel('Color')
                    .setPlaceholder("ex: #FF5733")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
                    .setValue(statusData.color || '');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(title),
                    new ActionRowBuilder().addComponents(description),
                    new ActionRowBuilder().addComponents(color)
                );
                await interaction.showModal(modal);
                return;
            }
            case 'status_images': {
                const modal = new ModalBuilder()
                    .setCustomId('status_images_modal')
                    .setTitle('Set your images');
                const bigImage = new TextInputBuilder()
                    .setCustomId('status_big_image')
                    .setLabel('Big Image ')
                    .setPlaceholder("ex: https://example.com/image.png")
                    .setValue(statusData.image || "")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);
                const thumbnail = new TextInputBuilder()
                    .setCustomId('status_thumbnail')
                    .setLabel('Thumbnail')
                    .setPlaceholder("ex: https://example.com/image.png")
                    .setValue('')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);
                modal.addComponents(
                    new ActionRowBuilder().addComponents(bigImage),
                    new ActionRowBuilder().addComponents(thumbnail)
                );
                await interaction.showModal(modal);
                return;
            }
            case 'status_author': {
                const modal = new ModalBuilder()
                    .setCustomId('status_author_modal')
                    .setTitle('Set your author information');
                const authorName = new TextInputBuilder()
                    .setCustomId('status_author_name')
                    .setLabel('Author Name')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
                    .setValue(statusData.author || '');
                const authorURL = new TextInputBuilder()
                    .setCustomId('status_author_url')
                    .setLabel('Author icon')
                    .setPlaceholder("ex: https://example.com/image.png OR {server_avatar} / {user_avatar}")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
                    .setValue(statusData.authorIcon || '');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(authorName),
                    new ActionRowBuilder().addComponents(authorURL)
                );
                await interaction.showModal(modal);
                return;
            }
            case 'status_variables': {
                await interaction.reply({
                    content: 'Use these to bring it to life: \n\n`{user}` - Mentions the user\n`{username}` - User\'s username\n`{serverName}` or `{server_name}` - Server name\n`{vanity}` - Vanity you want the bot to track\n`{role}` - The role given (mention)\n`{server_avatar}` - The server icon\n`{user_avatar}` - The user avatar',
                });
                return;
            }
            // status_channel button and select menu logic removed
            case 'status_timestamp': {
                statusData.timestamp = !statusData.timestamp;
                await statusData.save();
                // Rebuild the embed and buttons to reflect the new state
                const embed = new EmbedBuilder()
                    .setTitle(statusData.title || 'Vanity Embed Setup')
                    .setDescription(statusData.description || 'Use the buttons below to customize your vanity embed!\nYou can set the title, description, color, images, author, footer, timestamp, and channel. Once you are done, you can enable or disable the embed.')
                    .setColor(statusData.color || Colors.Greyple);
                if (statusData.footer) embed.setFooter({ text: statusData.footer });
                if (statusData.timestamp) embed.setTimestamp();
                if (statusData.image) embed.setImage(statusData.image);
                if (statusData.author) embed.setAuthor({ name: statusData.author });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('status_basicinfo')
                        .setLabel('basics (title, description, color)')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('status_images')
                        .setLabel('images (big image, thumbnail)')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('status_author')
                        .setLabel('author (name, icon)')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('status_variables')
                        .setLabel('variables')
                        .setStyle(ButtonStyle.Success)
                );

                const buttons2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('status_footer')
                        .setLabel('footer (text, icon)')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('status_timestamp')
                        .setLabel('timestamp')
                        .setStyle(statusData.timestamp ? ButtonStyle.Success : ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('status_channel')
                        .setLabel('set channel')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('status_enable')
                        .setLabel(statusData.enabled ? 'Disable' : 'Enable')
                        .setStyle(statusData.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
                );

                await interaction.update({
                    embeds: [embed],
                    components: [row, buttons2],
                });
                return;
            }
            case 'status_footer': {
                const modal = new ModalBuilder()
                    .setCustomId('status_footer_modal')
                    .setTitle('Set your footer information');
                const footerText = new TextInputBuilder()
                    .setCustomId('status_footer_text')
                    .setLabel('Footer Text')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
                    .setValue(statusData.footer || '');
                const footerIcon = new TextInputBuilder()
                    .setCustomId('status_footer_icon')
                    .setLabel('Footer Icon URL')
                    .setPlaceholder("ex: https://example.com/image.png")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
                    .setValue(''); // No footer icon saved in schema
                modal.addComponents(
                    new ActionRowBuilder().addComponents(footerText),
                    new ActionRowBuilder().addComponents(footerIcon)
                );
                await interaction.showModal(modal);
                return;
            // Handle channel select menu    
                // Rebuild the embed and buttons
                const embed = new EmbedBuilder()
                    .setTitle(statusData.title || 'Vanity Embed Setup')
                    .setDescription(statusData.description || 'Use the buttons below to customize your vanity embed!\nYou can set the title, description, color, images, author, footer, timestamp, and channel. Once you are done, you can enable or disable the embed.')
                    .setColor(statusData.color || Colors.Greyple);
                if (statusData.footer) embed.setFooter({ text: statusData.footer });
                if (statusData.timestamp) embed.setTimestamp();
                if (statusData.image) embed.setImage(statusData.image);
                if (statusData.author) embed.setAuthor({ name: statusData.author });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('status_basicinfo')
                        .setLabel('basics (title, description, color)')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('status_images')
                        .setLabel('images (big image, thumbnail)')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('status_author')
                        .setLabel('author (name, icon)')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('status_variables')
                        .setLabel('variables')
                        .setStyle(ButtonStyle.Success)
                );

                const buttons2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('status_footer')
                        .setLabel('footer (text, icon)')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('status_timestamp')
                        .setLabel('timestamp')
                        .setStyle(statusData.timestamp ? ButtonStyle.Success : ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('status_enable')
                        .setLabel(statusData.enabled ? 'Disable' : 'Enable')
                        .setStyle(statusData.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
                );

                await interaction.update({
                    embeds: [embed],
                    components: [row, buttons2],
                    content: `Channel set to <#${selectedChannel}>`,
                });
                return;
            }
            case 'status_enable': {
                statusData.enabled = !statusData.enabled;
                await statusData.save();
                // Rebuild the embed and buttons to reflect the new state
                const embed = new EmbedBuilder()
                    .setTitle(statusData.title || 'Vanity Embed Setup')
                    .setDescription(statusData.description || 'Use the buttons below to customize your vanity embed!\nYou can set the title, description, color, images, author, footer, timestamp, and channel. Once you are done, you can enable or disable the embed.')
                    .setColor(statusData.color || Colors.Greyple);
                if (statusData.footer) embed.setFooter({ text: statusData.footer });
                if (statusData.timestamp) embed.setTimestamp();
                if (statusData.image) embed.setImage(statusData.image);
                if (statusData.author) embed.setAuthor({ name: statusData.author });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('status_basicinfo')
                        .setLabel('basics (title, description, color)')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('status_images')
                        .setLabel('images (big image, thumbnail)')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('status_author')
                        .setLabel('author (name, icon)')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('status_variables')
                        .setLabel('variables')
                        .setStyle(ButtonStyle.Success)
                );

                const buttons2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('status_footer')
                        .setLabel('footer (text, icon)')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('status_timestamp')
                        .setLabel('timestamp')
                        .setStyle(statusData.timestamp ? ButtonStyle.Success : ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('status_enable')
                        .setLabel(statusData.enabled ? 'Disable' : 'Enable')
                        .setStyle(statusData.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
                );

                await interaction.update({
                    embeds: [embed],
                    components: [row, buttons2],
                });
                return;
            }
            default: {
                await interaction.reply({ content: 'Unknown button interaction.', ephemeral: true });
                return;
            }
        }
// (removed duplicate/erroneous switch/case block)
    },
    }