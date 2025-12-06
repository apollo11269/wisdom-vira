const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'dm',
    description: 'Send a direct message to a user',
    async execute(message, args) {
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply('❌ Please mention a user to send a DM to!');
        }
        
        const dmMessage = args.slice(1).join(' ');
        if (!dmMessage) {
            return message.reply('❌ Please provide a message to send!');
        }
        
        try {
            // Create DM embed
            const dmEmbed = new EmbedBuilder()
                .setTitle(`📨 Message from ${message.guild.name}`)
                .setDescription(dmMessage)
                .addFields(
                    { name: '👮 Sent by', value: message.author.tag, inline: true },
                    { name: '🏰 Server', value: message.guild.name, inline: true }
                )
                .setColor('#0099ff')
                .setThumbnail(message.guild.iconURL({ dynamic: true }))
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            // Send DM
            await target.send({ embeds: [dmEmbed] });
            
            // Confirmation embed
            const confirmEmbed = new EmbedBuilder()
                .setTitle('✅ DM Sent Successfully')
                .setDescription(`Message sent to **${target.tag}**`)
                .addFields(
                    { name: '👤 Recipient', value: `${target.tag} (${target.id})`, inline: true },
                    { name: '👮 Sender', value: message.author.tag, inline: true },
                    { name: '📝 Message', value: dmMessage.length > 100 ? dmMessage.substring(0, 100) + '...' : dmMessage, inline: false }
                )
                .setColor('#00ff00')
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            message.reply({ embeds: [confirmEmbed] });
            
        } catch (error) {
            console.error('Error sending DM:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Failed to Send DM')
                .setDescription(`Could not send a direct message to **${target.tag}**.`)
                .addFields(
                    { name: 'Target User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: 'Reason', value: 'User may have DMs disabled or blocked the bot.', inline: false }
                )
                .setColor('#E74C3C')
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();
            
            message.reply({ embeds: [errorEmbed] });
        }
    },
};