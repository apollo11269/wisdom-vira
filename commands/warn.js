const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Simple JSON-based warning system
const warningsFile = path.join(__dirname, '..', 'data', 'warnings.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Load warnings from file
function loadWarnings() {
    try {
        if (fs.existsSync(warningsFile)) {
            return JSON.parse(fs.readFileSync(warningsFile, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading warnings:', error);
    }
    return {};
}

// Save warnings to file
function saveWarnings(warnings) {
    try {
        fs.writeFileSync(warningsFile, JSON.stringify(warnings, null, 2));
    } catch (error) {
        console.error('Error saving warnings:', error);
    }
}

module.exports = {
    name: 'warn',
    description: 'Warn a user (auto-kick after 3 warnings)',
    async execute(message, args) {
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply('❌ Please mention a user to warn!');
        }
        
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            const member = await message.guild.members.fetch(target.id);
            
            // Check if target is the command author
            if (target.id === message.author.id) {
                return message.reply('❌ You cannot warn yourself!');
            }
            
            // Load current warnings
            const warnings = loadWarnings();
            const guildId = message.guild.id;
            const userId = target.id;
            
            // Initialize guild and user warnings if they don't exist
            if (!warnings[guildId]) warnings[guildId] = {};
            if (!warnings[guildId][userId]) warnings[guildId][userId] = [];
            
            // Add new warning
            const warning = {
                id: Date.now(),
                reason: reason,
                moderator: message.author.tag,
                timestamp: new Date().toISOString()
            };
            
            warnings[guildId][userId].push(warning);
            const warningCount = warnings[guildId][userId].length;
            
            // Save warnings
            saveWarnings(warnings);
            
            // Send DM to warned user
            const dmEmbed = new EmbedBuilder()
                .setTitle('⚠️ You have been warned!')
                .setDescription(`You have been warned in **${message.guild.name}**`)
                .addFields(
                    { name: '📝 Reason', value: reason, inline: false },
                    { name: '👮 Moderator', value: message.author.tag, inline: true },
                    { name: '⚠️ Warning Count', value: `${warningCount}/3`, inline: true }
                )
                .setColor('#ff9500')
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            if (warningCount >= 3) {
                dmEmbed.addFields({ name: '🚨 Action Taken', value: 'You have been automatically kicked for reaching 3 warnings!', inline: false });
            }
            
            try {
                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log(`Could not send DM to ${target.tag}`);
            }
            
            // Create response embed
            const embed = new EmbedBuilder()
                .setTitle('⚠️ User Warned')
                .setDescription(`**${target.tag}** has been warned.`)
                .addFields(
                    { name: '👤 User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: '👮 Moderator', value: message.author.tag, inline: true },
                    { name: '📝 Reason', value: reason, inline: false },
                    { name: '⚠️ Warning Count', value: `${warningCount}/3`, inline: true }
                )
                .setColor('#ff9500')
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            // Auto-kick after 3 warnings
            if (warningCount >= 3) {
                try {
                    await member.kick(`Auto-kick: Reached 3 warnings. Last warning by ${message.author.tag}: ${reason}`);
                    embed.addFields({ name: '🚨 Action Taken', value: 'User has been automatically kicked for reaching 3 warnings!', inline: false });
                    embed.setColor('#ff4757');
                } catch (kickError) {
                    console.error('Error auto-kicking user:', kickError);
                    embed.addFields({ name: '❌ Auto-kick Failed', value: 'Could not kick user automatically.', inline: false });
                }
            }
            
            message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error warning user:', error);
            if (error.code === 10007) {
                message.reply('❌ User not found in this server!');
            } else {
                message.reply('❌ An error occurred while trying to warn the user.');
            }
        }
    },
};