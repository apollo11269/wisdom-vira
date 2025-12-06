const { EmbedBuilder } = require('discord.js');
const { loadBirthdaySettings, saveBirthdaySettings } = require('./setupbirthdays.js');

module.exports = {
    name: 'removebirthday',
    aliases: ['deletebirthday', 'removebd'],
    description: 'Remove your birthday from the reminder system',
    async execute(message, args) {
        const guildId = message.guild.id;
        const userId = message.author.id;
        const settings = loadBirthdaySettings();

        // Check if birthday system is set up
        if (!settings[guildId]) {
            return message.reply({ content: '❌ Birthday system is not set up! Ask an administrator to use `!setupbirthdays` first.', ephemeral: true });
        }

        // Check if user has a birthday registered
        if (!settings[guildId].birthdays || !settings[guildId].birthdays[userId]) {
            const noBirthdayEmbed = new EmbedBuilder()
                .setTitle('❌ No Birthday Found')
                .setDescription('You don\'t have a birthday registered in the system.\n\nUse `!addbirthday DD/MM` to add your birthday.')
                .setColor('#ff0000')
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();

            return message.reply({ embeds: [noBirthdayEmbed], ephemeral: true });
        }

        const userBirthday = settings[guildId].birthdays[userId];
        
        // Get month name
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // Confirmation embed
        const confirmEmbed = new EmbedBuilder()
            .setTitle('🗑️ Remove Birthday?')
            .setDescription(`Are you sure you want to remove your birthday from the system?`)
            .addFields(
                { 
                    name: '📅 Current Birthday', 
                    value: `${userBirthday.day} ${monthNames[userBirthday.month - 1]}`, 
                    inline: true 
                },
                { 
                    name: '⚠️ Warning', 
                    value: 'This action cannot be undone. You\'ll need to re-add your birthday if you change your mind.', 
                    inline: false 
                }
            )
            .setColor('#FFA500')
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setFooter({ 
                text: 'Reply with "yes" to confirm or "no" to cancel', 
                iconURL: message.client.user.displayAvatarURL({ dynamic: true }) 
            })
            .setTimestamp();

        const confirmMessage = await message.reply({ embeds: [confirmEmbed] });

        // Wait for user confirmation
        const filter = (response) => {
            return response.author.id === message.author.id && 
                   ['yes', 'no', 'y', 'n'].includes(response.content.toLowerCase());
        };

        try {
            const collected = await message.channel.awaitMessages({ 
                filter, 
                max: 1, 
                time: 30000, 
                errors: ['time'] 
            });

            const response = collected.first().content.toLowerCase();
            
            if (response === 'no' || response === 'n') {
                const cancelledEmbed = new EmbedBuilder()
                    .setTitle('❌ Removal Cancelled')
                    .setDescription('Your birthday was not removed from the system.')
                    .setColor('#00ff00')
                    .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                    .setTimestamp();

                return confirmMessage.edit({ embeds: [cancelledEmbed] });
            }

            // Remove the birthday
            delete settings[guildId].birthdays[userId];
            saveBirthdaySettings(settings);

            // Success embed
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Birthday Removed Successfully!')
                .setDescription('Your birthday has been removed from the reminder system.')
                .addFields(
                    { 
                        name: '🗑️ Removed Birthday', 
                        value: `${userBirthday.day} ${monthNames[userBirthday.month - 1]}`, 
                        inline: true 
                    },
                    { 
                        name: '👤 User', 
                        value: message.author.tag, 
                        inline: true 
                    },
                    { 
                        name: '💡 Want to add it back?', 
                        value: 'Use `!addbirthday DD/MM` to register your birthday again.', 
                        inline: false 
                    }
                )
                .setColor('#00ff00')
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();

            confirmMessage.edit({ embeds: [successEmbed] });

        } catch (error) {
            const timeoutEmbed = new EmbedBuilder()
                .setTitle('⏰ Confirmation Timeout')
                .setDescription('Birthday removal cancelled due to timeout.')
                .setColor('#ff0000')
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();

            confirmMessage.edit({ embeds: [timeoutEmbed] });
        }
    },
};