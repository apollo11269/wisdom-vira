const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'userinfo',
    description: 'Shows information about a user',
    async execute(message, args) {
        const target = message.mentions.users.first() || message.author;
        const member = await message.guild.members.fetch(target.id).catch(() => null);
        
        if (!member) {
            return message.reply('❌ User not found in this server!');
        }
        
        const roles = member.roles.cache
            .filter(role => role.id !== message.guild.id)
            .map(role => role.toString())
            .slice(0, 10);
        
        const embed = new EmbedBuilder()
            .setTitle(`👤 User Information - ${target.username}`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: '🏷️ Username',
                    value: target.tag,
                    inline: true
                },
                {
                    name: '🆔 User ID',
                    value: target.id,
                    inline: true
                },
                {
                    name: '📅 Account Created',
                    value: `<t:${Math.floor(target.createdTimestamp / 1000)}:F>`,
                    inline: false
                },
                {
                    name: '📅 Joined Server',
                    value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'Unknown',
                    inline: false
                },
                {
                    name: '🎭 Nickname',
                    value: member.nickname || 'None',
                    inline: true
                },
                {
                    name: '🤖 Bot',
                    value: target.bot ? 'Yes' : 'No',
                    inline: true
                },
                {
                    name: `🎯 Roles [${roles.length}]`,
                    value: roles.length > 0 ? roles.join(', ') : 'None',
                    inline: false
                }
            )
            .setColor(member.displayHexColor || '#0099ff')
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    },
};