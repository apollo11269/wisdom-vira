const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'nuke',
    description: 'Delete and recreate the current channel',
    async execute(message, args) {
        // Permissions are checked in messageCreate.js
        // Check if bot has manage channels permission
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply('❌ I don\'t have permission to manage channels!');
        }
        
        try {
            const channel = message.channel;
            const channelName = channel.name;
            const channelTopic = channel.topic;
            const channelPosition = channel.position;
            const channelParent = channel.parent;
            const channelPermissions = channel.permissionOverwrites.cache;
            const channelNsfw = channel.nsfw;
            const channelRateLimitPerUser = channel.rateLimitPerUser;
            
            // Create the new channel with same properties
            const newChannel = await message.guild.channels.create({
                name: channelName,
                type: channel.type,
                topic: channelTopic,
                position: channelPosition,
                parent: channelParent,
                nsfw: channelNsfw,
                rateLimitPerUser: channelRateLimitPerUser,
                permissionOverwrites: channelPermissions,
                reason: `Channel nuked by ${message.author.tag}`
            });
            
            // Delete the old channel
            await channel.delete(`Channel nuked by ${message.author.tag}`);
            
            // Send confirmation in the new channel
            const embed = new EmbedBuilder()
                .setTitle('💥 Channel Nuked')
                .setDescription(`This channel has been successfully nuked and recreated!`)
                .addFields(
                    { name: '👮 Moderator', value: message.author.tag, inline: true },
                    { name: '📝 Channel', value: channelName, inline: true },
                    { name: '🕐 Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setColor('#ff4757')
                .setImage('https://media.giphy.com/media/oe33xf3B50fsc/giphy.gif')
                .setFooter({ text: 'WisdomJebril V3 By APollo <3' })
                .setTimestamp();
            
            await newChannel.send({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error nuking channel:', error);
            message.reply('❌ An error occurred while trying to nuke the channel.');
        }
    },
};