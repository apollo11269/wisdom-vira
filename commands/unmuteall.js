const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'unmuteall',
    aliases: ['hdro'],
    description: 'Unmute all users in your current voice channel',
    async execute(message, args) {
        // Check if bot has mute permissions
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.MuteMembers)) {
            return message.reply('❌ I don\'t have permission to unmute members!');
        }
        
        // Check if command author is in a voice channel
        if (!message.member.voice.channel) {
            return message.reply('❌ You need to be in a voice channel to use this command!');
        }
        
        const voiceChannel = message.member.voice.channel;
        const members = voiceChannel.members.filter(member => !member.user.bot && member.voice.mute);
        
        if (members.size === 0) {
            return message.reply('❌ No muted users found in your voice channel!');
        }
        
        let unmutedCount = 0;
        let failedCount = 0;
        
        // Unmute all members
        for (const [id, member] of members) {
            try {
                await member.voice.setMute(false, `Mass unmute by ${message.author.tag}`);
                unmutedCount++;
            } catch (error) {
                console.error(`Failed to unmute ${member.user.tag}:`, error);
                failedCount++;
            }
        }
        
        const embed = new EmbedBuilder()
            .setTitle('🔊 Mass Unmute Complete')
            .setDescription(`Unmuted users in **${voiceChannel.name}**`)
            .addFields(
                { name: '👮 Moderator', value: message.author.tag, inline: true },
                { name: '🎵 Voice Channel', value: voiceChannel.name, inline: true },
                { name: '📊 Results', value: `✅ Unmuted: ${unmutedCount}\n❌ Failed: ${failedCount}`, inline: true }
            )
            .setColor('#00ff00')
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    },
};