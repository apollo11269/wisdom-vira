const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'muteall',
    aliases: ['skto'],
    description: 'Mute all users in your current voice channel',
    async execute(message, args) {
        // Check if bot has mute permissions
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.MuteMembers)) {
            return message.reply('❌ I don\'t have permission to mute members!');
        }
        
        // Check if command author is in a voice channel
        if (!message.member.voice.channel) {
            return message.reply('❌ You need to be in a voice channel to use this command!');
        }
        
        const voiceChannel = message.member.voice.channel;
        const members = voiceChannel.members.filter(member => !member.user.bot && !member.voice.mute);
        
        if (members.size === 0) {
            return message.reply('❌ No unmuted users found in your voice channel!');
        }
        
        let mutedCount = 0;
        let failedCount = 0;
        
        // Mute all members
        for (const [id, member] of members) {
            try {
                await member.voice.setMute(true, `Mass mute by ${message.author.tag}`);
                mutedCount++;
            } catch (error) {
                console.error(`Failed to mute ${member.user.tag}:`, error);
                failedCount++;
            }
        }
        
        const embed = new EmbedBuilder()
            .setTitle('🔇 Mass Mute Complete')
            .setDescription(`Muted users in **${voiceChannel.name}**`)
            .addFields(
                { name: '👮 Moderator', value: message.author.tag, inline: true },
                { name: '🎵 Voice Channel', value: voiceChannel.name, inline: true },
                { name: '📊 Results', value: `✅ Muted: ${mutedCount}\n❌ Failed: ${failedCount}`, inline: true }
            )
            .setColor('#ff4757')
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    },
};