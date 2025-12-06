const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to store JA system settings
const jaSettingsPath = path.join(__dirname, '..', 'data', 'ja-settings.json');

// Load JA settings
function loadJASettings() {
    try {
        if (fs.existsSync(jaSettingsPath)) {
            return JSON.parse(fs.readFileSync(jaSettingsPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading JA settings:', error);
    }
    return {};
}

// Save JA settings
function saveJASettings(settings) {
    try {
        const dataDir = path.dirname(jaSettingsPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(jaSettingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Error saving JA settings:', error);
    }
}

module.exports = {
    name: 'ja',
    description: 'Toggle JA voice channel notification system',
    aliases: ['janotif', 'voicenotif'],
    async execute(message, args) {
        // Permissions are checked in messageCreate.js
        const guildId = message.guild.id;
        const settings = loadJASettings();
        
        if (!settings[guildId]) {
            settings[guildId] = {
                enabled: false,
                channelId: null
            };
        }

        const subcommand = args[0]?.toLowerCase();

        switch (subcommand) {
            case 'on':
                if (!settings[guildId].channelId) {
                    const setupEmbed = new EmbedBuilder()
                        .setTitle('⚠️ Setup Required')
                        .setDescription('Please setup the JA system first using:\n`!setupja <channelid>`')
                        .setColor('#FFA500')
                        .setTimestamp();
                    return message.reply({ embeds: [setupEmbed] });
                }
                
                settings[guildId].enabled = true;
                saveJASettings(settings);
                
                const onEmbed = new EmbedBuilder()
                    .setTitle('✅ JA System Enabled')
                    .setDescription('Voice channel join notifications are now **ON**')
                    .addFields({
                        name: '📢 Notification Channel',
                        value: `<#${settings[guildId].channelId}>`,
                        inline: true
                    })
                    .setColor('#00FF00')
                    .setTimestamp();
                message.reply({ embeds: [onEmbed] });
                break;

            case 'off':
                settings[guildId].enabled = false;
                saveJASettings(settings);
                
                const offEmbed = new EmbedBuilder()
                    .setTitle('❌ JA System Disabled')
                    .setDescription('Voice channel join notifications are now **OFF**')
                    .setColor('#FF0000')
                    .setTimestamp();
                message.reply({ embeds: [offEmbed] });
                break;

            case 'status':
                const statusEmbed = new EmbedBuilder()
                    .setTitle('📊 JA System Status')
                    .addFields(
                        {
                            name: '🔧 Status',
                            value: settings[guildId].enabled ? '✅ Enabled' : '❌ Disabled',
                            inline: true
                        },
                        {
                            name: '📢 Channel',
                            value: settings[guildId].channelId ? `<#${settings[guildId].channelId}>` : '❌ Not set',
                            inline: true
                        }
                    )
                    .setColor(settings[guildId].enabled ? '#00FF00' : '#FF0000')
                    .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                    .setTimestamp();
                message.reply({ embeds: [statusEmbed] });
                break;

            default:
                const helpEmbed = new EmbedBuilder()
                    .setTitle('🎤 JA Voice Notification System')
                    .setDescription('Manage voice channel join notifications')
                    .addFields(
                        {
                            name: '📝 Commands',
                            value: '`!ja on` - Enable notifications\n`!ja off` - Disable notifications\n`!ja status` - Check current status',
                            inline: false
                        },
                        {
                            name: '⚙️ Setup',
                            value: '`!setupja <channelid>` - Configure notification channel',
                            inline: false
                        }
                    )
                    .setColor('#0099FF')
                    .setTimestamp();
                message.reply({ embeds: [helpEmbed] });
                break;
        }
    }
};

// Export functions for use in other files
module.exports.loadJASettings = loadJASettings;
module.exports.saveJASettings = saveJASettings;