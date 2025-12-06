const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'deafen',
    description: 'Deafen a user in voice channels',
    async execute(message, args) {
        // Check if bot has deafen permissions
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.DeafenMembers)) {
            return message.reply('❌ I don\'t have permission to deafen members!');
        }
        
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply('❌ Please mention a user to deafen!');
        }
        
        try {
            const member = await message.guild.members.fetch(target.id);
            
            // Check if target is the command author
            if (target.id === message.author.id) {
                return message.reply('❌ You cannot deafen yourself!');
            }
            
            // Check if user is in a voice channel
            if (!member.voice.channel) {
                return message.reply('❌ This user is not in a voice channel!');
            }
            
            // Check if user is already deafened
            if (member.voice.deaf) {
                return message.reply('❌ This user is already deafened!');
            }
            
            // Deafen the user
            await member.voice.setDeaf(true, `Deafened by ${message.author.tag}`);
            
            const embed = new EmbedBuilder()
                .setTitle('🔇 User Deafened')
                .setDescription(`**${target.tag}** has been deafened in voice channels.`)
                .addFields(
                    { name: '👤 User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: '👮 Moderator', value: message.author.tag, inline: true },
                    { name: '🎵 Voice Channel', value: member.voice.channel.name, inline: true }
                )
                .setColor('#ff4757')
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error deafening user:', error);
            const err = new EmbedBuilder()
                .setTitle('❌ Failed to Deafen')
                .setDescription(error.code === 10007 ? 'User not found in this server.' : 'An unexpected error occurred while trying to deafen the user.')
                .setColor('#E74C3C');
            message.reply({ embeds: [err] });
        }
    },
};