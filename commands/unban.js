const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'unban',
    description: 'Unban a user by their ID',
    async execute(message, args) {
        // Check if bot has ban permissions
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('❌ I don\'t have permission to unban members!');
        }
        
        const userId = args[0];
        if (!userId) {
            return message.reply('❌ Please provide a user ID to unban!');
        }
        
        // Validate user ID format
        if (!/^\d{17,19}$/.test(userId)) {
            return message.reply('❌ Please provide a valid user ID!');
        }
        
        try {
            // Check if user is actually banned
            const ban = await message.guild.bans.fetch(userId).catch(() => null);
            if (!ban) {
                return message.reply('❌ This user is not banned!');
            }
            
            // Unban the user
            await message.guild.members.unban(userId, `Unbanned by ${message.author.tag}`);
            
            const embed = new EmbedBuilder()
                .setTitle('✅ User Unbanned')
                .setDescription(`**${ban.user.tag}** has been unbanned from the server.`)
                .addFields(
                    { name: '👤 User', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
                    { name: '👮 Moderator', value: message.author.tag, inline: true },
                    { name: '📝 Original Ban Reason', value: ban.reason || 'No reason provided', inline: false }
                )
                .setColor('#00ff00')
                .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error unbanning user:', error);
            if (error.code === 10026) {
                message.reply('❌ This user is not banned!');
            } else {
                message.reply('❌ An error occurred while trying to unban the user.');
            }
        }
    },
}