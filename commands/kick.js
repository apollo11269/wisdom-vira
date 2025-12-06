const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'kick',
    description: 'Kick a user from the server',
    async execute(message, args) {
        // Check if bot has kick permissions
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
            return message.reply('❌ I don\'t have permission to kick members!');
        }
        
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply('❌ Please mention a user to kick!');
        }
        
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            const member = await message.guild.members.fetch(target.id);
            
            // Check if target is kickable
            if (!member.kickable) {
                return message.reply('❌ I cannot kick this user! They may have higher permissions than me.');
            }
            
            // Check if target is the command author
            if (target.id === message.author.id) {
                return message.reply('❌ You cannot kick yourself!');
            }
            
            // Kick the user
            await member.kick(`Kicked by ${message.author.tag}: ${reason}`);
            
            const embed = new EmbedBuilder()
                .setTitle('👢 User Kicked')
                .setDescription(`**${target.tag}** has been kicked from the server.`)
                .addFields(
                    { name: '👤 User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: '👮 Moderator', value: message.author.tag, inline: true },
                    { name: '📝 Reason', value: reason, inline: false }
                )
                .setColor('#ff6348')
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error kicking user:', error);
            const err = new EmbedBuilder()
                .setTitle('❌ Failed to Kick')
                .setDescription(error.code === 10007 ? 'User not found in this server.' : 'An unexpected error occurred while trying to kick the user.')
                .setColor('#E74C3C');
            message.reply({ embeds: [err] });
        }
    },
};