const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'undeafen',
    description: 'Undeafen a user in voice channels',
    async execute(message, args) {
        // Check if bot has deafen permissions
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.DeafenMembers)) {
            return message.reply('❌ I don\'t have permission to undeafen members!');
        }
        
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply('❌ Please mention a user to undeafen!');
        }
        
        try {
            const member = await message.guild.members.fetch(target.id);
            
            // Check if user is in a voice channel
            if (!member.voice.channel) {
                return message.reply('❌ This user is not in a voice channel!');
            }
            
            // Check if user is actually deafened
            if (!member.voice.deaf) {
                return message.reply('❌ This user is not deafened!');
            }
            
            // Undeafen the user
            await member.voice.setDeaf(false, `Undeafened by ${message.author.tag}`);
            
            const embed = new EmbedBuilder()
                .setTitle('🔊 User Undeafened')
                .setDescription(`**${target.tag}** has been undeafened in voice channels.`)
                .addFields(
                    { name: '👤 User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: '👮 Moderator', value: message.author.tag, inline: true },
                    { name: '🎵 Voice Channel', value: member.voice.channel.name, inline: true }
                )
                .setColor('#00ff00')
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error undeafening user:', error);
            const err = new EmbedBuilder()
                .setTitle('❌ Failed to Undeafen')
                .setDescription(error.code === 10007 ? 'User not found in this server.' : 'An unexpected error occurred while trying to undeafen the user.')
                .setColor('#E74C3C');
            message.reply({ embeds: [err] });
        }
    },
};