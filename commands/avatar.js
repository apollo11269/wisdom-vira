const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'avatar',
    aliases: ['a', '1', 'A', 'AV', 'av', 'Av', 'aV'],
    description: 'Shows user avatar',
    async execute(message, args) {
        let target = message.mentions.users.first() || null;
        if (!target && args && args[0]) {
            const id = args[0].replace(/[^0-9]/g, '');
            if (id && id.length >= 17 && id.length <= 22) {
                try {
                    const fetched = await message.client.users.fetch(id);
                    if (fetched) target = fetched;
                } catch (_) {
                    const member = message.guild?.members?.cache?.get(id);
                    if (member) target = member.user;
                }
            }
        }
        if (!target) target = message.author;
        
        const embed = new EmbedBuilder()
            .setTitle(`🖼️ ${target.username}'s Avatar`)
            .setImage(target.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setColor('#ff6b6b')
            .addFields(
                {
                    name: '🔗 Links',
                    value: `[PNG](${target.displayAvatarURL({ format: 'png', size: 1024 })}) | [JPG](${target.displayAvatarURL({ format: 'jpg', size: 1024 })}) | [WEBP](${target.displayAvatarURL({ format: 'webp', size: 1024 })})${target.avatar && target.avatar.startsWith('a_') ? ` | [GIF](${target.displayAvatarURL({ format: 'gif', size: 1024 })})` : ''}`,
                    inline: false
                }
            )
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};