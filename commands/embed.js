const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'embed',
    description: 'Send a custom embed message',
    async execute(message, args) {
        if (!args.length) {
            const err = new EmbedBuilder()
                .setTitle('❌ Missing Content')
                .setDescription('Please provide content to send in the embed.')
                .setColor('#E74C3C');
            return message.reply({ embeds: [err] });
        }
        
        try {
            // Delete the command message
            await message.delete();
            
            const content = args.join(' ');
            
            // Parse embed parameters
            let title = null;
            let description = content;
            let color = '#0099ff';
            let footer = null;
            let image = null;
            let thumbnail = null;
            
            // Extract title if provided
            const titleMatch = content.match(/--title="([^"]+)"/i);
            if (titleMatch) {
                title = titleMatch[1];
                description = description.replace(titleMatch[0], '').trim();
            }
            
            // Extract color if provided
            const colorMatch = content.match(/--color="?([#a-fA-F0-9]{6}|[a-zA-Z]+)"?/i);
            if (colorMatch) {
                color = colorMatch[1];
                description = description.replace(colorMatch[0], '').trim();
            }
            
            // Extract footer if provided
            const footerMatch = content.match(/--footer="([^"]+)"/i);
            if (footerMatch) {
                footer = footerMatch[1];
                description = description.replace(footerMatch[0], '').trim();
            }
            
            // Extract image if provided
            const imageMatch = content.match(/--image="([^"]+)"/i);
            if (imageMatch) {
                image = imageMatch[1];
                description = description.replace(imageMatch[0], '').trim();
            }
            
            // Extract thumbnail if provided
            const thumbnailMatch = content.match(/--thumbnail="([^"]+)"/i);
            if (thumbnailMatch) {
                thumbnail = thumbnailMatch[1];
                description = description.replace(thumbnailMatch[0], '').trim();
            }
            
            // Create the embed
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTimestamp();
            
            if (title) embed.setTitle(title);
            if (description) embed.setDescription(description);
            embed.setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' });
            if (image) embed.setImage(image);
            if (thumbnail) embed.setThumbnail(thumbnail);
            
            // Send the embed
            await message.channel.send({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error creating embed:', error);
            message.channel.send('❌ An error occurred while creating the embed. Please check your formatting.');
        }
    },
};