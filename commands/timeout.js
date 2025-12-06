const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// Parse time string to milliseconds
function parseTime(timeStr) {
    const timeRegex = /^(\d+)([smhd])$/i;
    const match = timeStr.match(timeRegex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

module.exports = {
    name: 'timeout',
    description: 'Timeout a user (format: 1s, 5m, 2h, 1d)',
    async execute(message, args) {
        // Check if bot has timeout permissions
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ I don\'t have permission to timeout members!');
        }
        
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply('❌ Please mention a user to timeout!');
        }
        
        const timeStr = args[1];
        if (!timeStr) {
            return message.reply('❌ Please provide a time duration! (e.g., 5m, 1h, 2d)');
        }
        
        const duration = parseTime(timeStr);
        if (!duration) {
            return message.reply('❌ Invalid time format! Use: 1s, 5m, 2h, 1d');
        }
        
        if (duration > 28 * 24 * 60 * 60 * 1000) {
            return message.reply('❌ Timeout duration cannot exceed 28 days!');
        }
        
        const reason = args.slice(2).join(' ') || 'No reason provided';
        
        try {
            const member = await message.guild.members.fetch(target.id);
            
            // Check if target can be timed out
            if (!member.moderatable) {
                return message.reply('❌ I cannot timeout this user! They may have higher permissions than me.');
            }
            
            // Check if target is the command author
            if (target.id === message.author.id) {
                return message.reply('❌ You cannot timeout yourself!');
            }
            
            // Timeout the user
            await member.timeout(duration, `Timed out by ${message.author.tag}: ${reason}`);
            
            const embed = new EmbedBuilder()
                .setTitle('⏰ User Timed Out')
                .setDescription(`**${target.tag}** has been timed out.`)
                .addFields(
                    { name: '👤 User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: '👮 Moderator', value: message.author.tag, inline: true },
                    { name: '⏱️ Duration', value: timeStr, inline: true },
                    { name: '📝 Reason', value: reason, inline: false },
                    { name: '⏰ Ends', value: `<t:${Math.floor((Date.now() + duration) / 1000)}:F>`, inline: false }
                )
                .setColor('#ff6b35')
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error timing out user:', error);
            const err = new EmbedBuilder()
                .setTitle('❌ Failed to Timeout')
                .setDescription(error.code === 10007 ? 'User not found in this server.' : 'An unexpected error occurred while trying to timeout the user.')
                .setColor('#E74C3C');
            message.reply({ embeds: [err] });
        }
    },
};