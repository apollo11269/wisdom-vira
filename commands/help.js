const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'help',
    aliases: ['commands', 'menu'],
    description: 'Shows an interactive command menu',
    execute(message, args) {
        // Main menu embed
        const mainEmbed = new EmbedBuilder()
            .setTitle('🤖 WisdomJebril V3 - Interactive Command Menu')
            .setDescription('Welcome to the advanced command center! Choose a category below to explore commands.')
            .setColor('#2F3136')
            .addFields(
                {
                    name: '📋 Quick Stats',
                    value: `\`\`\`\n📊 Total Commands: 50+\n🎯 Categories: 8\n⚡ Response Time: <1s\n🔧 Version: 3.0.0\`\`\``,
                    inline: true
                },
                {
                    name: '🚀 Getting Started',
                    value: '• Use the dropdown menu below\n• Click category buttons for quick access\n• All commands use `!` prefix\n• Admin commands require permissions',
                    inline: true
                },
                {
                    name: '💡 Pro Tips',
                    value: '• Use `!help [command]` for detailed info\n• Commands are case-insensitive\n• Some commands have aliases\n• Check permissions before using',
                    inline: false
                }
            )
            .setThumbnail(message.client.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();

        // Category selection dropdown
        const categorySelect = new StringSelectMenuBuilder()
            .setCustomId('help_category_select')
            .setPlaceholder('🔍 Select a command category to explore...')
            .addOptions([
                {
                    label: 'Moderation Commands',
                    description: 'Ban, kick, mute, timeout and more moderation tools',
                    value: 'moderation',
                    emoji: '👮'
                },
                {
                    label: 'Management Commands',
                    description: 'Server management, roles, channels and utilities',
                    value: 'management',
                    emoji: '🔧'
                },
                {
                    label: 'Information Commands',
                    description: 'User info, server stats, data retrieval, and tsara command',
                    value: 'information',
                    emoji: '📊'
                },
                {
                    label: 'Voice Commands',
                    description: 'Voice channel management and controls',
                    value: 'voice',
                    emoji: '🎵'
                },
                {
                    label: 'Birthday System',
                    description: 'Birthday reminders and celebration features',
                    value: 'birthday',
                    emoji: '🎂'
                },
                {
                    label: 'Report System',
                    description: 'User reporting and moderation queue',
                    value: 'report',
                    emoji: '📝'
                },
                {
                    label: 'Special Commands',
                    description: 'Advanced features and admin utilities',
                    value: 'special',
                    emoji: '⚡'
                },
                {
                    label: 'Help & Support',
                    description: 'Documentation and assistance commands',
                    value: 'help_support',
                    emoji: '📚'
                }
            ]);

        // Quick access buttons
        const quickButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('help_moderation')
                    .setLabel('Moderation')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('👮'),
                new ButtonBuilder()
                    .setCustomId('help_management')
                    .setLabel('Management')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔧'),
                new ButtonBuilder()
                    .setCustomId('help_birthday')
                    .setLabel('Birthdays')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🎂'),
                new ButtonBuilder()
                    .setCustomId('help_all_commands')
                    .setLabel('All Commands')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('📋')
            );

        // Navigation buttons
        const navButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('help_refresh')
                    .setLabel('Refresh')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔄'),
                new ButtonBuilder()
                    .setLabel('Support')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/your-support-server')
                    .setEmoji('🆘'),
                new ButtonBuilder()
                    .setLabel('Invite Bot')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=8&scope=bot')
                    .setEmoji('➕')
            );

        const selectRow = new ActionRowBuilder().addComponents(categorySelect);

        message.reply({ 
            embeds: [mainEmbed], 
            components: [selectRow, quickButtons, navButtons],
            ephemeral: true
        });
    },
};