const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'ban',
    aliases: ['qawed', 'QAWED', 'tla7'],
    description: 'Ban a user from the server',
    async execute(message, args) {
        // Check if bot has ban permissions
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('❌ I don\'t have permission to ban members!');
        }
        
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply('❌ Please mention a user to ban!');
        }
        
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            const member = await message.guild.members.fetch(target.id);
            
            // Check if target is bannable
            if (!member.bannable) {
                return message.reply('❌ I cannot ban this user! They may have higher permissions than me.');
            }
            
            // Check if target is the command author
            if (target.id === message.author.id) {
                return message.reply('❌ You cannot ban yourself!');
            }
            
            // Ban the user
            await member.ban({ reason: `Banned by ${message.author.tag}: ${reason}` });
            
            const embed = new EmbedBuilder()
                .setTitle('🔨 User Banned')
                .setDescription(`**${target.tag}** has been banned from the server.`)
                .addFields(
                    { name: '👤 User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: '👮 Moderator', value: message.author.tag, inline: true },
                    { name: '📝 Reason', value: reason, inline: false }
                )
                .setColor('#ff4757')
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error banning user:', error);
            const err = new EmbedBuilder()
                .setTitle('❌ Failed to Ban')
                .setDescription(error.code === 10007 ? 'User not found in this server.' : 'An unexpected error occurred while trying to ban the user.')
                .setColor('#E74C3C');
            message.reply({ embeds: [err] });
        }
    },
};