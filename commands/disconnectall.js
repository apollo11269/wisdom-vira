const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'disconnectall',
    description: 'Disconnect all users from your voice channel',
    async execute(message, args) {
        // Check if bot has move members permission (needed to disconnect)
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.MoveMembers)) {
            return message.reply('❌ I don\'t have permission to disconnect members!');
        }
        
        // Check if command author is in a voice channel
        if (!message.member.voice.channel) {
            return message.reply('❌ You need to be in a voice channel to use this command!');
        }
        
        try {
            const voiceChannel = message.member.voice.channel;
            const members = voiceChannel.members.filter(member => 
                !member.user.bot && member.id !== message.author.id
            );
            
            if (members.size === 0) {
                return message.reply('❌ No other users found in your voice channel!');
            }
            
            let disconnectedCount = 0;
            let failedCount = 0;
            
            // Disconnect all members except the command author
            for (const [id, member] of members) {
                try {
                    await member.voice.disconnect(`Mass disconnect by ${message.author.tag}`);
                    disconnectedCount++;
                } catch (error) {
                    console.error(`Failed to disconnect ${member.user.tag}:`, error);
                    failedCount++;
                }
            }
            
            const embed = new EmbedBuilder()
                .setTitle('📞 Mass Disconnect Complete')
                .setDescription(`Disconnected users from **${voiceChannel.name}**`)
                .addFields(
                    { name: '👮 Moderator', value: message.author.tag, inline: true },
                    { name: '🎵 Voice Channel', value: voiceChannel.name, inline: true },
                    { name: '📊 Results', value: `✅ Disconnected: ${disconnectedCount}\n❌ Failed: ${failedCount}`, inline: false }
                )
                .setColor('#ff4757')
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error disconnecting users:', error);
            message.reply('❌ An error occurred while trying to disconnect users.');
        }
    },
};