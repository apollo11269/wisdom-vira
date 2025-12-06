const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'giveaway',
    description: 'Start a giveaway',
    async execute(message, args) {
        if (args.length < 3) {
            return message.reply('❌ Usage: `giveaway <time> <winners> <prize>`\nExample: `giveaway 1h 1 Discord Nitro`');
        }
        
        try {
            const timeString = args[0];
            const winnersCount = parseInt(args[1]);
            const prize = args.slice(2).join(' ');
            
            // Parse time
            const timeRegex = /^(\d+)([smhd])$/i;
            const timeMatch = timeString.match(timeRegex);
            
            if (!timeMatch) {
                return message.reply('❌ Invalid time format! Use: s (seconds), m (minutes), h (hours), d (days)');
            }
            
            const timeValue = parseInt(timeMatch[1]);
            const timeUnit = timeMatch[2].toLowerCase();
            
            let milliseconds;
            switch (timeUnit) {
                case 's':
                    milliseconds = timeValue * 1000;
                    break;
                case 'm':
                    milliseconds = timeValue * 60 * 1000;
                    break;
                case 'h':
                    milliseconds = timeValue * 60 * 60 * 1000;
                    break;
                case 'd':
                    milliseconds = timeValue * 24 * 60 * 60 * 1000;
                    break;
            }
            
            if (milliseconds > 30 * 24 * 60 * 60 * 1000) { // 30 days max
                return message.reply('❌ Giveaway duration cannot exceed 30 days!');
            }
            
            if (isNaN(winnersCount) || winnersCount < 1 || winnersCount > 20) {
                return message.reply('❌ Winners count must be between 1 and 20!');
            }
            
            // Delete the command message
            await message.delete();
            
            const endTime = Date.now() + milliseconds;
            
            const embed = new EmbedBuilder()
                .setTitle('🎉 GIVEAWAY 🎉')
                .setDescription(`**${prize}**\n\nReact with 🎉 to enter!\n\n**Winners:** ${winnersCount}\n**Ends:** <t:${Math.floor(endTime / 1000)}:R>\n**Hosted by:** ${message.author}`)
                .setColor('#ffa502')
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp(endTime);
            
            const giveawayMessage = await message.channel.send({ embeds: [embed] });
            await giveawayMessage.react('🎉');
            
            // Set timeout to end giveaway
            setTimeout(async () => {
                try {
                    const updatedMessage = await message.channel.messages.fetch(giveawayMessage.id);
                    const reaction = updatedMessage.reactions.cache.get('🎉');
                    
                    if (!reaction) {
                        const noReactionEmbed = new EmbedBuilder()
                            .setTitle('🎉 GIVEAWAY ENDED 🎉')
                            .setDescription(`**${prize}**\n\n**Winners:** No valid entries\n**Hosted by:** ${message.author}`)
                            .setColor('#ff4757')
                            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                            .setTimestamp();
                        
                        return updatedMessage.edit({ embeds: [noReactionEmbed] });
                    }
                    
                    const users = await reaction.users.fetch();
                    const validUsers = users.filter(user => !user.bot && user.id !== message.author.id);
                    
                    if (validUsers.size === 0) {
                        const noWinnersEmbed = new EmbedBuilder()
                            .setTitle('🎉 GIVEAWAY ENDED 🎉')
                            .setDescription(`**${prize}**\n\n**Winners:** No valid entries\n**Hosted by:** ${message.author}`)
                            .setColor('#ff4757')
                            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                            .setTimestamp();
                        
                        return updatedMessage.edit({ embeds: [noWinnersEmbed] });
                    }
                    
                    const winners = validUsers.random(Math.min(winnersCount, validUsers.size));
                    const winnersList = Array.isArray(winners) ? winners : [winners];
                    
                    const winnersEmbed = new EmbedBuilder()
                        .setTitle('🎉 GIVEAWAY ENDED 🎉')
                        .setDescription(`**${prize}**\n\n**Winners:** ${winnersList.map(w => `<@${w.id}>`).join(', ')}\n**Hosted by:** ${message.author}`)
                        .setColor('#00ff00')
                        .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                        .setTimestamp();
                    
                    await updatedMessage.edit({ embeds: [winnersEmbed] });
                    
                    // Announce winners
                    const announceEmbed = new EmbedBuilder()
                        .setTitle('🎉 Congratulations! 🎉')
                        .setDescription(`${winnersList.map(w => `<@${w.id}>`).join(', ')} won **${prize}**!`)
                        .setColor('#00ff00')
                        .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                        .setTimestamp();
                    
                    await message.channel.send({ embeds: [announceEmbed] });
                    
                } catch (error) {
                    console.error('Error ending giveaway:', error);
                }
            }, milliseconds);
            
        } catch (error) {
            console.error('Error creating giveaway:', error);
            message.channel.send('❌ An error occurred while creating the giveaway.');
        }
    },
};