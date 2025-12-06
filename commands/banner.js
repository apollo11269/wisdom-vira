const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'banner',
    aliases: ['b', 'B', 'ba', 'Ba', 'BA'],
    description: 'Shows user banner',
    async execute(message, args) {
        // Get target user (mentioned user or message author)
        const target = message.mentions.users.first() || message.author;
        
        try {
            // Fetch the user to get banner info
            const user = await target.fetch();
            
            if (!user.banner) {
                const embed = new EmbedBuilder()
                    .setTitle(`🖼️ ${target.username}'s Banner`)
                    .setDescription('❌ This user doesn\'t have a banner set.')
                    .setColor('#ff4757')
                    .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            const bannerURL = user.bannerURL({ dynamic: true, size: 1024 });
            
            const embed = new EmbedBuilder()
                .setTitle(`🖼️ ${target.username}'s Banner`)
                .setImage(bannerURL)
                .setColor('#4834d4')
                .addFields(
                    {
                        name: '🔗 Links',
                        value: `[PNG](${user.bannerURL({ format: 'png', size: 1024 })}) | [JPG](${user.bannerURL({ format: 'jpg', size: 1024 })}) | [WEBP](${user.bannerURL({ format: 'webp', size: 1024 })})${user.banner && user.banner.startsWith('a_') ? ` | [GIF](${user.bannerURL({ format: 'gif', size: 1024 })})` : ''}`,
                        inline: false
                    }
                )
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching user banner:', error);
            message.reply('❌ An error occurred while fetching the banner.');
        }
    },
};