const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'announce',
    description: 'Send an announcement to a specific channel',
    async execute(message, args) {
        if (!args.length) {
            return message.reply('❌ Please provide content for the announcement!');
        }
        
        try {
            // Check if a channel is mentioned
            const channelMention = message.mentions.channels.first();
            let targetChannel = channelMention || message.channel;
            
            // Remove channel mention from args if present
            let content = args.join(' ');
            if (channelMention) {
                content = content.replace(/<#\d+>/, '').trim();
            }
            
            if (!content) {
                return message.reply('❌ Please provide content for the announcement!');
            }
            
            // Delete the command message
            await message.delete();
            
            // Create announcement embed
            const embed = new EmbedBuilder()
                .setTitle('📢 Announcement')
                .setDescription(content)
                .setColor('#ffa502')
                .setAuthor({ 
                    name: message.author.tag, 
                    iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                })
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            // Send the announcement
            await targetChannel.send({ embeds: [embed] });
            
            // Send confirmation if announcement was sent to a different channel
            if (targetChannel.id !== message.channel.id) {
                const confirmEmbed = new EmbedBuilder()
                    .setTitle('✅ Announcement Sent')
                    .setDescription(`Your announcement has been sent to ${targetChannel}.`)
                    .setColor('#00ff00')
                    .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                    .setTimestamp();
                
                const confirmMessage = await message.channel.send({ embeds: [confirmEmbed] });
                setTimeout(() => {
                    confirmMessage.delete().catch(() => {});
                }, 5000);
            }
            
        } catch (error) {
            console.error('Error sending announcement:', error);
            message.channel.send('❌ An error occurred while sending the announcement.');
        }
    },
};