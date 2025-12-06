const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Path to store antitag data
const antitagPath = path.join(__dirname, '..', 'data', 'antitag.json');

// Load antitag data
function loadAntitags() {
    try {
        if (fs.existsSync(antitagPath)) {
            const data = fs.readFileSync(antitagPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading antitag data:', error);
    }
    return {};
}

// Save antitag data
function saveAntitags(antitags) {
    try {
        const dataDir = path.dirname(antitagPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(antitagPath, JSON.stringify(antitags, null, 2));
    } catch (error) {
        console.error('Error saving antitag data:', error);
    }
}

module.exports = {
    name: 'antitag',
    description: 'Register yourself to prevent unwanted pings and auto-respond to mentions',
    usage: '!antitag [@user] [on/off/status]',
    requiredPermissions: [],
    
    async execute(message, args) {
        const antitags = loadAntitags();
        const guildId = message.guild.id;
        
        if (!antitags[guildId]) {
            antitags[guildId] = {};
        }
        
        // If no arguments, show user's current status
        if (args.length === 0) {
            const userId = message.author.id;
            const isProtected = antitags[guildId][userId] || false;
            
            const embed = new EmbedBuilder()
                .setColor(isProtected ? '#ff0000' : '#00ff00')
                .setTitle('🏷️ Antitag Status')
                .setDescription(`Your antitag protection is currently **${isProtected ? 'ON' : 'OFF'}**`)
                .addFields(
                    { name: 'Usage', value: '`!antitag on` - Enable protection\n`!antitag off` - Disable protection\n`!antitag @user` - Check someone\'s status', inline: false }
                )
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Check if first argument is a user mention
        const mentionedUser = message.mentions.users.first();
        
        if (mentionedUser) {
            // Check someone else's status (admin only)
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Permission Denied')
                    .setDescription('Only administrators can check other users\' antitag status.')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            const targetId = mentionedUser.id;
            const isProtected = antitags[guildId][targetId] || false;
            
            const embed = new EmbedBuilder()
                .setColor(isProtected ? '#ff0000' : '#00ff00')
                .setTitle('🏷️ Antitag Status')
                .setDescription(`${mentionedUser.username}'s antitag protection is **${isProtected ? 'ON' : 'OFF'}**`)
                .setThumbnail(mentionedUser.displayAvatarURL())
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Handle on/off commands
        const action = args[0].toLowerCase();
        const userId = message.author.id;
        
        if (action === 'on') {
            antitags[guildId][userId] = true;
            saveAntitags(antitags);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Antitag Protection Enabled')
                .setDescription('You are now protected from unwanted pings. When someone mentions you, they will receive an automatic warning.')
                .addFields(
                    { name: 'What happens now?', value: '• People who mention you will get a warning message\n• Your mentions will be automatically handled\n• Use `!antitag off` to disable', inline: false }
                )
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (action === 'off') {
            delete antitags[guildId][userId];
            saveAntitags(antitags);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Antitag Protection Disabled')
                .setDescription('You are no longer protected from pings. People can mention you normally.')
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (action === 'status') {
            const isProtected = antitags[guildId][userId] || false;
            
            const embed = new EmbedBuilder()
                .setColor(isProtected ? '#ff0000' : '#00ff00')
                .setTitle('🏷️ Antitag Status')
                .setDescription(`Your antitag protection is currently **${isProtected ? 'ON' : 'OFF'}**`)
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Invalid usage
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Invalid Usage')
            .setDescription('Please use one of the following commands:')
            .addFields(
                { name: 'Commands', value: '`!antitag on` - Enable protection\n`!antitag off` - Disable protection\n`!antitag status` - Check your status\n`!antitag @user` - Check someone\'s status (admin only)', inline: false }
            )
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }
};

// Export functions for use in messageCreate.js
module.exports.loadAntitags = loadAntitags;
module.exports.saveAntitags = saveAntitags;