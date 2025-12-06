const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'rtimeout',
    description: 'Remove timeout from a user',
    async execute(message, args) {
        // Check if bot has timeout permissions
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ I don\'t have permission to manage timeouts!');
        }
        
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply('❌ Please mention a user to remove timeout from!');
        }
        
        try {
            const member = await message.guild.members.fetch(target.id);
            
            // Check if user is actually timed out
            if (!member.isCommunicationDisabled()) {
                return message.reply('❌ This user is not currently timed out!');
            }
            
            // Remove timeout
            await member.timeout(null, `Timeout removed by ${message.author.tag}`);
            
            const embed = new EmbedBuilder()
                .setTitle('✅ Timeout Removed')
                .setDescription(`**${target.tag}**'s timeout has been removed.`)
                .addFields(
                    { name: '👤 User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: '👮 Moderator', value: message.author.tag, inline: true }
                )
                .setColor('#00ff00')
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error removing timeout:', error);
            if (error.code === 10007) {
                message.reply('❌ User not found in this server!');
            } else {
                message.reply('❌ An error occurred while trying to remove the timeout.');
            }
        }
    },
};