const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to store apply system settings
const applySettingsPath = path.join(__dirname, '..', 'data', 'apply-settings.json');

// Load apply settings
function loadApplySettings() {
    try {
        if (fs.existsSync(applySettingsPath)) {
            return JSON.parse(fs.readFileSync(applySettingsPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading apply settings:', error);
    }
    return {};
}

// Save apply settings
function saveApplySettings(settings) {
    try {
        const dataDir = path.dirname(applySettingsPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(applySettingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Error saving apply settings:', error);
    }
}

module.exports = {
    name: 'setupapply',
    description: 'Setup staff application system',
    aliases: ['applysetup', 'setapply'],
    async execute(message, args) {
        // Permissions are checked in messageCreate.js
        const channelId = args[0];
        
        if (!channelId) {
            const helpEmbed = new EmbedBuilder()
                .setTitle('⚙️ Setup Staff Application System')
                .setDescription('Configure the channel for staff applications')
                .addFields({
                    name: '📝 Usage',
                    value: '`!setupapply <channelid>`\n\n**Example:**\n`!setupapply 1234567890123456789`',
                    inline: false
                })
                .setColor('#0099FF')
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            return message.reply({ embeds: [helpEmbed] });
        }

        // Validate channel ID
        const channel = message.guild.channels.cache.get(channelId);
        if (!channel) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Invalid Channel')
                .setDescription('Channel not found! Please provide a valid channel ID.')
                .setColor('#FF0000')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }

        // Check if bot can send messages to the channel
        if (!channel.permissionsFor(message.guild.members.me).has(['SEND_MESSAGES', 'EMBED_LINKS'])) {
            const permErrorEmbed = new EmbedBuilder()
                .setTitle('❌ Permission Error')
                .setDescription(`I don't have permission to send messages in ${channel}!`)
                .setColor('#FF0000')
                .setTimestamp();
            return message.reply({ embeds: [permErrorEmbed] });
        }

        // Save settings
        const guildId = message.guild.id;
        const settings = loadApplySettings();
        settings[guildId] = {
            channelId: channelId,
            setupBy: message.author.id,
            setupAt: Date.now()
        };
        saveApplySettings(settings);

        // Create the application embed with language buttons
        const applyEmbed = new EmbedBuilder()
            .setTitle('🛡️ Join Our Staff Team')
            .setDescription('> **Ready to make a difference?**\n> Help us build an amazing community!\n\n**What we\'re looking for:**\n🔹 Active & dedicated members\n🔹 Mature & responsible attitude\n🔹 Strong communication skills\n🔹 Regular availability\n\n**Ready to apply? Choose your language:**')
            .setColor('#5865F2')
            .setThumbnail(message.guild.iconURL({ dynamic: true, size: 256 }))
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();

        // Create language selection buttons
        const languageRow1 = new ActionRowBuilder()
            .addComponents(
                    new ButtonBuilder()
                        .setCustomId('apply_arabic')
                        .setLabel('العربية')
                        .setEmoji('🇸🇦')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('apply_english')
                        .setLabel('English')
                        .setEmoji('🇺🇸')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('apply_darija')
                        .setLabel('الدارجة المغربية')
                        .setEmoji('🇲🇦')
                        .setStyle(ButtonStyle.Primary)
                );
        
        const languageRow2 = new ActionRowBuilder()
            .addComponents(
                    new ButtonBuilder()
                        .setCustomId('apply_tamazight')
                        .setLabel('ⵜⴰⵎⴰⵣⵉⵖⵜ')
                        .setEmoji('<:tamazight:1328392111963504771>')
                        .setStyle(ButtonStyle.Primary)
                );

        // Send the application embed to the specified channel
        try {
            await channel.send({ 
                content: '@everyone',
                embeds: [applyEmbed], 
                components: [languageRow1, languageRow2] 
            });

            // Success confirmation
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Staff Application System Setup Complete')
                .setDescription('The staff application system has been successfully configured!')
                .addFields(
                    {
                        name: '📢 Application Channel',
                        value: `${channel}`,
                        inline: true
                    },
                    {
                        name: '📊 Submission Channel',
                        value: `<#1409971599377039370>`,
                        inline: true
                    },
                    {
                        name: '🌐 Languages Available',
                        value: '• العربية (Arabic)\n• English\n• الدارجة المغربية (Moroccan Darija)\n• ⵜⴰⵎⴰⵣⵉⵖⵜ (Tamazight)',
                        inline: false
                    }
                )
                .setColor('#00FF00')
                .setTimestamp();
            
            message.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error setting up apply system:', error);
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Setup Failed')
                .setDescription('Failed to setup the application system. Please try again.')
                .setColor('#FF0000')
                .setTimestamp();
            message.reply({ embeds: [errorEmbed] });
        }
    }
};

// Export functions for use in other files
module.exports.loadApplySettings = loadApplySettings;
module.exports.saveApplySettings = saveApplySettings;
