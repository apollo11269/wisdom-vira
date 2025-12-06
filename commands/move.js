const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'move',
    aliases: ['aji'],
    description: 'Move a user to a different voice channel',
    async execute(message, args) {
        // Check if bot has move members permission
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.MoveMembers)) {
            return message.reply('❌ I don\'t have permission to move members!');
        }
        
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply('❌ Please mention a user to move!');
        }
        
        const channelName = args.slice(1).join(' ');
        if (!channelName) {
            return message.reply('❌ Please provide a voice channel name!');
        }
        
        try {
            const member = await message.guild.members.fetch(target.id);
            
            // Check if user is in a voice channel
            if (!member.voice.channel) {
                return message.reply('❌ This user is not in a voice channel!');
            }
            
            // Find the target voice channel
            const targetChannel = message.guild.channels.cache.find(channel => 
                channel.type === 2 && // Voice channel type
                channel.name.toLowerCase().includes(channelName.toLowerCase())
            );
            
            if (!targetChannel) {
                return message.reply('❌ Voice channel not found!');
            }
            
            const originalChannel = member.voice.channel;
            
            // Move the user
            await member.voice.setChannel(targetChannel, `Moved by ${message.author.tag}`);
            
            const embed = new EmbedBuilder()
                .setTitle('🔄 User Moved')
                .setDescription(`**${target.tag}** has been moved to a different voice channel.`)
                .addFields(
                    { name: '👤 User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: '👮 Moderator', value: message.author.tag, inline: true },
                    { name: '📤 From', value: originalChannel.name, inline: true },
                    { name: '📥 To', value: targetChannel.name, inline: true }
                )
                .setColor('#4834d4')
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error moving user:', error);
            if (error.code === 10007) {
                message.reply('❌ User not found in this server!');
            } else {
                message.reply('❌ An error occurred while trying to move the user.');
            }
        }
    },
};