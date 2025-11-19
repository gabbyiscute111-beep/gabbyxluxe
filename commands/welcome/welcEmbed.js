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
const Welcome = require('../../Schemas.js/welcomeSchema.js');

module.exports = {
    handleModal: async function(interaction) {
        try {
            // Only handle our modals

            if (!interaction.customId.startsWith('welc_')) return;
        
        let welcData;
        try {
            welcData = await Welcome.findOne({ guildId: interaction.guild.id }) || 
                        new Welcome({ guildId: interaction.guild.id });
        } catch (error) {
            console.error('Database error in modal handler:', error.message);
            await interaction.reply({ content: 'Database error occurred. Please try again later.', ephemeral: true });
            return;
        }
                if (interaction.customId === 'welc_basicinfo_modal') {
            const title = interaction.fields.getTextInputValue('welc_title');
            const description = interaction.fields.getTextInputValue('welc_description');
            const color = interaction.fields.getTextInputValue('welc_color');
            
            // Save or remove title
            welcData.title = title.trim() || undefined;
            // Save or remove description  
            welcData.description = description.trim() || undefined;
            // Save or remove color
            welcData.color = color.trim() || undefined;
            
            await welcData.save();
        } else if (interaction.customId === 'welc_author_modal') {
            const author = interaction.fields.getTextInputValue('welc_author_name');
            const authorIcon = interaction.fields.getTextInputValue('welc_author_url');
            
            // Save or remove author
            welcData.author = author.trim() || undefined;
            // Save or remove author icon
            welcData.authorIcon = authorIcon.trim() || undefined;
            
            await welcData.save();
        } else if (interaction.customId === 'welc_footer_modal') {
            const footer = interaction.fields.getTextInputValue('welc_footer_text');
            const footerIcon = interaction.fields.getTextInputValue('welc_footer_icon');
            
            // Save or remove footer text and icon
            welcData.footer = footer.trim() || undefined;
            welcData.footerIcon = footerIcon.trim() || undefined;
            
            await welcData.save();
        } else if (interaction.customId === 'welc_images_modal') {
            const image = interaction.fields.getTextInputValue('welc_big_image');
            const thumbnail = interaction.fields.getTextInputValue('welc_thumbnail');
            
            // Save or remove image and thumbnail
            welcData.image = image.trim() || undefined;
            welcData.thumbnail = thumbnail.trim() || undefined;
            
            await welcData.save();
        }

        const replaceVars = (str) => {
            if (!str) return str;
            return str
                .replace(/{user}/gi, `<@${interaction.user.id}>`)
                .replace(/{username}/gi, interaction.user.username)
                .replace(/{serverName}/gi, interaction.guild.name)
                .replace(/{server_name}/gi, interaction.guild.name)
                .replace(/{server_avatar}/gi, interaction.guild.iconURL({ dynamic: true, size: 256 }) || '')
                .replace(/{user_avatar}/gi, interaction.user.displayAvatarURL({ dynamic: true, size: 256 }) || '');
        };
        const embed = new EmbedBuilder()
            .setTitle(welcData.title || 'Welcome Embed Setup')
            .setDescription(welcData.description || 'Use the buttons below to customize your welcome embed!\nYou can set the title, description, color, images, author, footer, timestamp, and channel. Once you are done, you can enable or disable the embed.')
            .setColor(welcData.color || Colors.Greyple);
        if (welcData.footer) {
            const footerObj = { text: replaceVars(welcData.footer) };
            if (welcData.footerIcon) footerObj.iconURL = replaceVars(welcData.footerIcon);
            embed.setFooter(footerObj);
        }
        if (welcData.timestamp) embed.setTimestamp();
        if (welcData.image) embed.setImage(replaceVars(welcData.image));
        if (welcData.thumbnail) embed.setThumbnail(replaceVars(welcData.thumbnail));
        if (welcData.author) {
            const authorObj = { name: replaceVars(welcData.author) };
            if (welcData.authorIcon) {
                const authorIconUrl = replaceVars(welcData.authorIcon);
                if (authorIconUrl && authorIconUrl.startsWith('http')) {
                    authorObj.iconURL = authorIconUrl;
                }
            }
            embed.setAuthor(authorObj);
        }
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('welc_basicinfo')
                .setLabel('basics (title, description, color)')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('welc_images')
                .setLabel('images (big image, thumbnail)')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('welc_author')
                .setLabel('author (name, icon)')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('welc_channel')
                .setLabel('set channel')
                .setStyle(ButtonStyle.Primary)
        );
        const buttons2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('welc_footer')
                .setLabel('footer (text, icon)')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('welc_variables')
                .setLabel('variables')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('welc_timestamp')
                .setLabel('timestamp')
                .setStyle(welcData.timestamp ? ButtonStyle.Success : ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('welc_enable')
                .setLabel(welcData.enabled ? 'Disable' : 'Enable')
                .setStyle(welcData.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
        );

        await interaction.update({
            embeds: [embed],
            components: [row, buttons2],
        });
        } catch (error) {
            // Silently handle errors to prevent double acknowledgment issues
            console.log('Modal interaction already handled');
        }
    },

    handleButton: async function(interaction) {
        try {
            console.log('Button/Select customId:', interaction.customId);
            
            let welcData;
            try {
                welcData = await Welcome.findOne({ guildId: interaction.guild.id }) || 
                            new Welcome({ guildId: interaction.guild.id });
            } catch (error) {
                console.error('Database error in button handler:', error.message);
                await interaction.reply({ content: 'Database error occurred. Please try again later.', ephemeral: true });
                return;
            }

        if (interaction.customId === 'welc_basicinfo') {
            const modal = new ModalBuilder()
                .setCustomId('welc_basicinfo_modal')
                .setTitle('Basic Info Setup');

            const titleInput = new TextInputBuilder()
                .setCustomId('welc_title')
                .setLabel('Embed Title')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Enter embed title...')
                .setValue(welcData.title || '')
                .setRequired(false);

            const descInput = new TextInputBuilder()
                .setCustomId('welc_description')
                .setLabel('Embed Description')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Enter embed description...')
                .setValue(welcData.description || '')
                .setRequired(false);

            const colorInput = new TextInputBuilder()
                .setCustomId('welc_color')
                .setLabel('Embed Color (hex code)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('#ffffff')
                .setValue(welcData.color || '')
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descInput),
                new ActionRowBuilder().addComponents(colorInput)
            );

            await interaction.showModal(modal);
            return;

        } else if (interaction.customId === 'welc_author') {
            const modal = new ModalBuilder()
                .setCustomId('welc_author_modal')
                .setTitle('Author Setup');

            const authorInput = new TextInputBuilder()
                .setCustomId('welc_author_name')
                .setLabel('Author Name')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Enter author name...')
                .setValue(welcData.author || '')
                .setRequired(false);

            const authorIconInput = new TextInputBuilder()
                .setCustomId('welc_author_url')
                .setLabel('Author Icon URL')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('https://example.com/icon.png')
                .setValue(welcData.authorIcon || '')
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(authorInput),
                new ActionRowBuilder().addComponents(authorIconInput)
            );

            await interaction.showModal(modal);
            return;

        } else if (interaction.customId === 'welc_footer') {
            const modal = new ModalBuilder()
                .setCustomId('welc_footer_modal')
                .setTitle('Footer Setup');

            const footerInput = new TextInputBuilder()
                .setCustomId('welc_footer_text')
                .setLabel('Footer Text')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Enter footer text...')
                .setValue(welcData.footer || '')
                .setRequired(false);

            const footerIconInput = new TextInputBuilder()
                .setCustomId('welc_footer_icon')
                .setLabel('Footer Icon URL')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('https://example.com/icon.png')
                .setValue(welcData.footerIcon || '')
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(footerInput),
                new ActionRowBuilder().addComponents(footerIconInput)
            );

            await interaction.showModal(modal);
            return;

        } else if (interaction.customId === 'welc_images') {
            const modal = new ModalBuilder()
                .setCustomId('welc_images_modal')
                .setTitle('Images Setup');

            const imageInput = new TextInputBuilder()
                .setCustomId('welc_big_image')
                .setLabel('Big Image URL')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('https://example.com/image.png')
                .setValue(welcData.image || '')
                .setRequired(false);

            const thumbnailInput = new TextInputBuilder()
                .setCustomId('welc_thumbnail')
                .setLabel('Thumbnail URL')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('https://example.com/thumbnail.png')
                .setValue(welcData.thumbnail || '')
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(imageInput),
                new ActionRowBuilder().addComponents(thumbnailInput)
            );

            await interaction.showModal(modal);
            return;

        } else if (interaction.customId === 'welc_variables') {
            const embed = new EmbedBuilder()
                .setTitle('Available Variables')
                .setDescription('You can use these variables in your embed:\n\n' +
                    '`{user}` - Mentions the user\n' +
                    '`{username}` - User\'s username\n' +
                    '`{serverName}` or `{server_name}` - Server name\n' +
                    '`{memberCount}` - Total server member count\n' +
                    '`{server_avatar}` - Server icon URL\n' +
                    '`{user_avatar}` - User avatar URL')
                .setColor(Colors.Blurple);

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;

        } else if (interaction.customId === 'welc_channel') {
            const channels = interaction.guild.channels.cache
                .filter(channel => channel.isTextBased() && channel.permissionsFor(interaction.guild.members.me).has('SendMessages'))
                .first(25); // Limit to 25 channels for select menu

            if (channels.length === 0) {
                await interaction.reply({ 
                    content: '❌ No text channels found where I can send messages!', 
                    ephemeral: true 
                });
                return;
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('welc_channel_select')
                .setPlaceholder('Choose a channel for welcome messages')
                .addOptions(
                    channels.map(channel => ({
                        label: `#${channel.name}`,
                        description: channel.topic ? channel.topic.substring(0, 50) : 'No description',
                        value: channel.id,
                        default: welcData.welcomeChannel === channel.id
                    }))
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({
                content: 'Select a channel where welcome messages will be sent:',
                components: [row],
                ephemeral: true
            });
            return;

        } else if (interaction.customId === 'welc_timestamp') {
            welcData.timestamp = !welcData.timestamp;
            await welcData.save();
            
            // Refresh the embed
            const replaceVars = (str) => {
                if (!str) return str;
                return str
                    .replace(/{user}/gi, `<@${interaction.user.id}>`)
                    .replace(/{username}/gi, interaction.user.username)
                    .replace(/{serverName}/gi, interaction.guild.name)
                    .replace(/{server_name}/gi, interaction.guild.name)
                    .replace(/{server_avatar}/gi, interaction.guild.iconURL({ dynamic: true, size: 256 }) || '')
                    .replace(/{user_avatar}/gi, interaction.user.displayAvatarURL({ dynamic: true, size: 256 }) || '');
            }

            const channelInfo = welcData.welcomeChannel ? 
                `\n\n**Channel:** <#${welcData.welcomeChannel}>\n**Status:** ${welcData.enabled ? '✅ Enabled' : '❌ Disabled'}` : 
                `\n\n**Channel:** Not set\n**Status:** ${welcData.enabled ? '✅ Enabled' : '❌ Disabled'}`;

            let description = 'Use the buttons below to customize your welcome embed!\nYou can set the title, description, color, images, author, footer, timestamp, and channel. Once you are done, you can enable or disable the embed.';
            if (welcData.description) {
                description = replaceVars(welcData.description);
            }
            description += channelInfo;

            const embed = new EmbedBuilder()
                .setTitle(replaceVars(welcData.title) || 'Welcome Embed Setup')
                .setDescription(description)
                .setColor(welcData.color || Colors.Greyple);
            if (welcData.footer) {
                const footerObj = { text: replaceVars(welcData.footer) };
                if (welcData.footerIcon) footerObj.iconURL = replaceVars(welcData.footerIcon);
                embed.setFooter(footerObj);
            }
            if (welcData.timestamp) embed.setTimestamp();
            if (welcData.image) embed.setImage(replaceVars(welcData.image));
            if (welcData.thumbnail) embed.setThumbnail(replaceVars(welcData.thumbnail));
            if (welcData.author) {
                const authorObj = { name: replaceVars(welcData.author) };
                if (welcData.authorIcon) {
                    const authorIconUrl = replaceVars(welcData.authorIcon);
                    if (authorIconUrl && authorIconUrl.startsWith('http')) {
                        authorObj.iconURL = authorIconUrl;
                    }
                }
                embed.setAuthor(authorObj);
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('welc_basicinfo')
                    .setLabel('basics (title, description, color)')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('welc_images')
                    .setLabel('images (big image, thumbnail)')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('welc_author')
                    .setLabel('author (name, icon)')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('welc_variables')
                    .setLabel('variables')
                    .setStyle(ButtonStyle.Success)
            );
            const buttons2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('welc_footer')
                    .setLabel('footer (text, icon)')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('welc_timestamp')
                    .setLabel('timestamp')
                    .setStyle(welcData.timestamp ? ButtonStyle.Success : ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('welc_enable')
                    .setLabel(welcData.enabled ? 'Disable' : 'Enable')
                    .setStyle(welcData.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            );

            await interaction.update({
                embeds: [embed],
                components: [row, buttons2],
            });
            return;

        } else if (interaction.customId === 'welc_enable') {
            welcData.enabled = !welcData.enabled;
            await welcData.save();

            await interaction.reply({ 
                content: `Welcome embed ${welcData.enabled ? 'enabled' : 'disabled'}!`, 
                ephemeral: true 
            });
            return;
        } else if (interaction.customId === 'welc_channel_select') {
            const selectedChannelId = interaction.values[0];
            const channel = interaction.guild.channels.cache.get(selectedChannelId);
            
            if (!channel) {
                await interaction.reply({ 
                    content: '❌ Selected channel not found!', 
                    ephemeral: true 
                });
                return;
            }

            welcData.welcomeChannel = selectedChannelId;
            await welcData.save();

            await interaction.reply({ 
                content: `✅ Welcome channel set to ${channel}!`, 
                ephemeral: true 
            });
            return;
        }
        } catch (error) {
            // Silently handle errors to prevent double acknowledgment issues
            console.log('Button interaction already handled');
        }
    },
    
    data: new SlashCommandBuilder()
        .setName('welc-setup')
        .setDescription('Setup your welcome embed!')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        console.log('Starting welc-setup execution');
        await interaction.deferReply();
        console.log('Reply deferred');
        
        try {
            let welcData;
            console.log('Attempting database query...');
            
            try {
                welcData = await Welcome.findOne({ guildId: interaction.guild.id });
                console.log('Database query completed, found data:', !!welcData);
                
                if (!welcData) {
                    console.log('No data found, creating new document');
                    welcData = new Welcome({ 
                        guildId: interaction.guild.id,
                        welcomeChannel: null,
                        enabled: false
                    });
                }
            } catch (e) {
                console.error('Database error:', e);
                welcData = { 
                    title: '', 
                    description: '', 
                    footer: '', 
                    timestamp: false, 
                    image: '', 
                    author: '', 
                    enabled: false,
                    channel: null,
                    color: null
                };
            }

            // Variable replacement for images and text
            const replaceVars = (str) => {
                if (!str) return str;
                return str
                    .replace(/{user}/gi, `<@${interaction.user.id}>`)
                    .replace(/{username}/gi, interaction.user.username)
                    .replace(/{serverName}/gi, interaction.guild.name)
                    .replace(/{server_name}/gi, interaction.guild.name)
                    .replace(/{memberCount}/gi, interaction.guild.memberCount.toString())
                    .replace(/{server_avatar}/gi, interaction.guild.iconURL({ dynamic: true, size: 256 }) || '')
                    .replace(/{user_avatar}/gi, interaction.user.displayAvatarURL({ dynamic: true, size: 256 }) || '');
            };

            const channelInfo = welcData.welcomeChannel ? 
                `\n\n**Channel:** <#${welcData.welcomeChannel}>\n**Status:** ${welcData.enabled ? '✅ Enabled' : '❌ Disabled'}` : 
                `\n\n**Channel:** Not set\n**Status:** ${welcData.enabled ? '✅ Enabled' : '❌ Disabled'}`;

            let description = 'Use the buttons below to customize your welcome embed!\nYou can set the title, description, color, images, author, footer, timestamp, and channel. Once you are done, you can enable or disable the embed.';
            if (welcData.description) {
                description = replaceVars(welcData.description);
            }
            description += channelInfo;

            console.log('Building embed...');
            const embed = new EmbedBuilder()
                .setTitle(replaceVars(welcData.title) || 'Welcome Embed Setup')
                .setDescription(description)
                .setColor(welcData.color || Colors.Greyple);
            console.log('Embed built successfully');
            if (welcData.footer) {
                const footerObj = { text: replaceVars(welcData.footer) };
                if (welcData.footerIcon) footerObj.iconURL = replaceVars(welcData.footerIcon);
                embed.setFooter(footerObj);
            }
            if (welcData.timestamp) embed.setTimestamp();
            if (welcData.image) embed.setImage(replaceVars(welcData.image));
            if (welcData.thumbnail) embed.setThumbnail(replaceVars(welcData.thumbnail));
            if (welcData.author) {
                const authorObj = { name: replaceVars(welcData.author) };
                if (welcData.authorIcon) {
                    const authorIconUrl = replaceVars(welcData.authorIcon);
                    if (authorIconUrl && authorIconUrl.startsWith('http')) {
                        authorObj.iconURL = authorIconUrl;
                    }
                }
                embed.setAuthor(authorObj);
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('welc_basicinfo')
                    .setLabel('basics (title, description, color)')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('welc_images')
                    .setLabel('images (big image, thumbnail)')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('welc_author')
                    .setLabel('author (name, icon)')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('welc_variables')
                    .setLabel('variables')
                    .setStyle(ButtonStyle.Success)
            );
            const buttons2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('welc_footer')
                    .setLabel('footer (text, icon)')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('welc_timestamp')
                    .setLabel('timestamp')
                    .setStyle(welcData.timestamp ? ButtonStyle.Success : ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('welc_enable')
                    .setLabel(welcData.enabled ? 'Disable' : 'Enable')
                    .setStyle(welcData.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
            );

            console.log('Sending reply...');
            await interaction.editReply({
                embeds: [embed],
                components: [row, buttons2],
            });
            console.log('Reply sent successfully');
        } catch (err) {
            console.error('Error in /welc-setup:', err);
            try {
                await interaction.editReply('There was an error while executing this command!');
            } catch (replyErr) {
                console.error('Error sending error reply:', replyErr);
            }
        }
    }
};
