const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════════
//                           WELCOME SYSTEM TOGGLE COMMAND
// ═══════════════════════════════════════════════════════════════════════════════
// This command manages the welcome system with features:
// • Toggle welcome messages on/off
// • Server-specific settings
// • Admin-only access
// • Persistent configuration storage
// ═══════════════════════════════════════════════════════════════════════════════

// Path to store welcome settings
const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'welcome-settings.json');

// Ensure data directory exists
const dataDir = path.dirname(SETTINGS_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Load welcome settings
function loadWelcomeSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading welcome settings:', error);
    }
    return {};
}

// Save welcome settings
function saveWelcomeSettings(settings) {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving welcome settings:', error);
        return false;
    }
}

// Check if welcome is enabled for a guild
function isWelcomeEnabled(guildId) {
    const settings = loadWelcomeSettings();
    return settings[guildId]?.enabled !== false; // Default to true
}

module.exports = {
    name: 'welcome',
    description: 'Toggle welcome messages on or off',
    aliases: ['welcometoggle', 'wc'],
    usage: '!welcome <on|off|status>',
    permissions: [PermissionFlagsBits.ManageGuild],
    async execute(message, args) {
        // Permissions are checked in messageCreate.js

        const subcommand = args[0]?.toLowerCase();
        const guildId = message.guild.id;
        const settings = loadWelcomeSettings();

        // Initialize guild settings if not exists
        if (!settings[guildId]) {
            settings[guildId] = { enabled: true };
        }

        switch (subcommand) {
            case 'on':
            case 'enable':
            case 'true':
                settings[guildId].enabled = true;
                if (saveWelcomeSettings(settings)) {
                    const enableEmbed = new EmbedBuilder()
                        .setTitle('✅ Welcome System Enabled')
                        .setDescription('Welcome messages are now **enabled** for this server!')
                        .addFields(
                            {
                                name: '🎉 Features Active',
                                value: '• Welcome DMs to new members\n• Public welcome messages\n• Member statistics tracking\n• Auto-role assignment (if configured)',
                                inline: false
                            },
                            {
                                name: '⚙️ Configuration',
                                value: 'Welcome messages will be sent to new members automatically.',
                                inline: false
                            }
                        )
                        .setColor('#00D26A')
                        .setThumbnail(message.guild.iconURL({ dynamic: true }))
                        .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                        .setTimestamp();
                    
                    message.reply({ embeds: [enableEmbed] });
                } else {
                    message.reply('❌ Failed to save settings. Please try again.');
                }
                break;

            case 'off':
            case 'disable':
            case 'false':
                settings[guildId].enabled = false;
                if (saveWelcomeSettings(settings)) {
                    const disableEmbed = new EmbedBuilder()
                        .setTitle('🔕 Welcome System Disabled')
                        .setDescription('Welcome messages are now **disabled** for this server.')
                        .addFields(
                            {
                                name: '⏸️ Features Paused',
                                value: '• No welcome DMs will be sent\n• No public welcome messages\n• Statistics tracking continues\n• Auto-roles still work (if configured)',
                                inline: false
                            },
                            {
                                name: '🔄 Re-enable',
                                value: 'Use `!welcome on` to re-enable welcome messages.',
                                inline: false
                            }
                        )
                        .setColor('#FF6B6B')
                        .setThumbnail(message.guild.iconURL({ dynamic: true }))
                        .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                        .setTimestamp();
                    
                    message.reply({ embeds: [disableEmbed] });
                } else {
                    message.reply('❌ Failed to save settings. Please try again.');
                }
                break;

            case 'status':
            case 'info':
            default:
                const currentStatus = settings[guildId].enabled;
                const statusEmbed = new EmbedBuilder()
                    .setTitle('🎛️ Welcome System Status')
                    .setDescription(`Welcome messages are currently **${currentStatus ? 'ENABLED' : 'DISABLED'}** for this server.`)
                    .addFields(
                        {
                            name: '📊 Current Configuration',
                            value: `**Status:** ${currentStatus ? '✅ Active' : '❌ Inactive'}\n**Welcome DMs:** ${currentStatus ? '✅ Sending' : '❌ Disabled'}\n**Public Messages:** ${currentStatus ? '✅ Sending' : '❌ Disabled'}\n**Statistics:** ✅ Always Active`,
                            inline: true
                        },
                        {
                            name: '🎯 Available Commands',
                            value: '`!welcome on` - Enable welcome messages\n`!welcome off` - Disable welcome messages\n`!welcome status` - Check current status',
                            inline: true
                        },
                        {
                            name: '📈 Server Stats',
                            value: `**Total Members:** ${message.guild.memberCount}\n**Humans:** ${message.guild.members.cache.filter(m => !m.user.bot).size}\n**Bots:** ${message.guild.members.cache.filter(m => m.user.bot).size}`,
                            inline: false
                        }
                    )
                    .setColor(currentStatus ? '#00D26A' : '#FF6B6B')
                    .setThumbnail(message.guild.iconURL({ dynamic: true }))
                    .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                    .setTimestamp();
                
                message.reply({ embeds: [statusEmbed] });
                break;
        }
    },

    // Export utility functions for use in guildMemberAdd event
    isWelcomeEnabled,
    loadWelcomeSettings,
    saveWelcomeSettings
};