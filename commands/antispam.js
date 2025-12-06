const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'antispam',
    description: 'Configure the anti-spam system',
    aliases: ['as', 'spam'],
    async execute(message, args) {
        // Import spam settings from messageCreate event
        const messageCreateEvent = require('../events/messageCreate.js');
        const spamSettings = messageCreateEvent.spamSettings;
        
        if (args.length === 0) {
            // Show current settings
            const embed = new EmbedBuilder()
                .setTitle('🛡️ Anti-Spam System')
                .setDescription('Current anti-spam configuration')
                .addFields(
                    { name: '🔧 Status', value: spamSettings.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                    { name: '⚡ Max Messages', value: `${spamSettings.maxMessages} messages`, inline: true },
                    { name: '⏱️ Time Window', value: `${spamSettings.timeWindow/1000} seconds`, inline: true },
                    { name: '🔄 Duplicate Threshold', value: `${spamSettings.duplicateThreshold} messages`, inline: true },
                    { name: '🔗 Link Spam Threshold', value: `${spamSettings.linkSpamThreshold} links`, inline: true },
                    { name: '📢 Caps Threshold', value: `${spamSettings.capsThreshold}%`, inline: true },
                    { name: '⏰ Mute Duration', value: `${spamSettings.muteDuration/60000} minutes`, inline: true }
                )
                .setColor(spamSettings.enabled ? '#2ecc71' : '#e74c3c')
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const subcommand = args[0].toLowerCase();
        
        switch (subcommand) {
            case 'enable':
            case 'on':
                spamSettings.enabled = true;
                return message.reply('✅ Anti-spam system has been **enabled**!');
                
            case 'disable':
            case 'off':
                spamSettings.enabled = false;
                return message.reply('❌ Anti-spam system has been **disabled**!');
                
            case 'toggle':
                spamSettings.enabled = !spamSettings.enabled;
                return message.reply(`${spamSettings.enabled ? '✅ Enabled' : '❌ Disabled'} anti-spam system!`);
                
            case 'maxmessages':
            case 'max':
                const maxMessages = parseInt(args[1]);
                if (isNaN(maxMessages) || maxMessages < 2 || maxMessages > 20) {
                    return message.reply('❌ Please provide a valid number between 2 and 20!');
                }
                spamSettings.maxMessages = maxMessages;
                return message.reply(`✅ Max messages set to **${maxMessages}**!`);
                
            case 'timewindow':
            case 'time':
                const timeWindow = parseInt(args[1]);
                if (isNaN(timeWindow) || timeWindow < 3 || timeWindow > 30) {
                    return message.reply('❌ Please provide a valid time window between 3 and 30 seconds!');
                }
                spamSettings.timeWindow = timeWindow * 1000;
                return message.reply(`✅ Time window set to **${timeWindow} seconds**!`);
                
            case 'duplicate':
            case 'dup':
                const dupThreshold = parseInt(args[1]);
                if (isNaN(dupThreshold) || dupThreshold < 2 || dupThreshold > 10) {
                    return message.reply('❌ Please provide a valid number between 2 and 10!');
                }
                spamSettings.duplicateThreshold = dupThreshold;
                return message.reply(`✅ Duplicate threshold set to **${dupThreshold}**!`);
                
            case 'links':
            case 'link':
                const linkThreshold = parseInt(args[1]);
                if (isNaN(linkThreshold) || linkThreshold < 2 || linkThreshold > 10) {
                    return message.reply('❌ Please provide a valid number between 2 and 10!');
                }
                spamSettings.linkSpamThreshold = linkThreshold;
                return message.reply(`✅ Link spam threshold set to **${linkThreshold}**!`);
                
            case 'caps':
                const capsThreshold = parseInt(args[1]);
                if (isNaN(capsThreshold) || capsThreshold < 40 || capsThreshold > 90) {
                    return message.reply('❌ Please provide a valid percentage between 40 and 90!');
                }
                spamSettings.capsThreshold = capsThreshold;
                return message.reply(`✅ Caps threshold set to **${capsThreshold}%**!`);
                
            case 'mute':
            case 'timeout':
                const muteDuration = parseInt(args[1]);
                if (isNaN(muteDuration) || muteDuration < 1 || muteDuration > 60) {
                    return message.reply('❌ Please provide a valid duration between 1 and 60 minutes!');
                }
                spamSettings.muteDuration = muteDuration * 60000;
                return message.reply(`✅ Mute duration set to **${muteDuration} minutes**!`);
                
            case 'reset':
                // Reset to default values
                spamSettings.enabled = true;
                spamSettings.maxMessages = 3;
                spamSettings.timeWindow = 5000;
                spamSettings.duplicateThreshold = 2;
                spamSettings.linkSpamThreshold = 2;
                spamSettings.capsThreshold = 60;
                spamSettings.muteDuration = 300000;
                return message.reply('✅ Anti-spam settings have been **reset** to default values!');
                
            case 'help':
            case 'commands':
                const helpEmbed = new EmbedBuilder()
                    .setTitle('🛡️ Anti-Spam Commands')
                    .setDescription('Available anti-spam configuration commands')
                    .addFields(
                        { name: '🔧 Basic Commands', value: '`!antispam` - Show current settings\n`!antispam enable/disable` - Toggle system\n`!antispam toggle` - Quick toggle', inline: false },
                        { name: '⚙️ Configuration', value: '`!antispam max <2-20>` - Max messages\n`!antispam time <3-30>` - Time window (seconds)\n`!antispam duplicate <2-10>` - Duplicate threshold', inline: false },
                        { name: '🔧 Advanced Settings', value: '`!antispam links <2-10>` - Link spam threshold\n`!antispam caps <40-90>` - Caps percentage\n`!antispam mute <1-60>` - Mute duration (minutes)', inline: false },
                        { name: '🔄 Utility', value: '`!antispam reset` - Reset to defaults\n`!antispam help` - Show this help', inline: false }
                    )
                    .setColor('#3498db')
                    .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                    .setTimestamp();
                
                return message.reply({ embeds: [helpEmbed] });
                
            default:
                return message.reply('❌ Invalid subcommand! Use `!antispam help` to see available commands.');
        }
    },
};