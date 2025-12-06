const { EmbedBuilder } = require('discord.js');
const { loadBirthdaySettings, saveBirthdaySettings } = require('./setupbirthdays.js');

module.exports = {
    name: 'addbirthday',
    aliases: ['birthday', 'bd'],
    description: 'Add your birthday to the reminder system',
    async execute(message, args) {
        const guildId = message.guild.id;
        const userId = message.author.id;
        const settings = loadBirthdaySettings();

        // Check if birthday system is set up
        if (!settings[guildId]) {
            return message.reply({ content: '❌ Birthday system is not set up! Ask an administrator to use `!setupbirthdays` first.', ephemeral: true });
        }

        // Check if birthday format is provided
        if (!args[0]) {
            const helpEmbed = new EmbedBuilder()
                .setTitle('🎂 Add Your Birthday')
                .setDescription('Please provide your birthday in DD/MM format!')
                .addFields(
                    {
                        name: '📝 Format',
                        value: '`!addbirthday DD/MM`',
                        inline: true
                    },
                    {
                        name: '📅 Examples',
                        value: '`!addbirthday 15/03` (March 15th)\n`!addbirthday 07/12` (December 7th)',
                        inline: true
                    }
                )
                .setColor('#FF69B4')
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();

            return message.reply({ embeds: [helpEmbed], ephemeral: true });
        }

        // Validate birthday format
        const birthdayRegex = /^(\d{1,2})\/(\d{1,2})$/;
        const match = args[0].match(birthdayRegex);

        if (!match) {
            return message.reply({ content: '❌ Invalid format! Please use DD/MM format (e.g., 15/03 for March 15th)', ephemeral: true });
        }

        const day = parseInt(match[1]);
        const month = parseInt(match[2]);

        // Validate day and month
        if (day < 1 || day > 31) {
            return message.reply({ content: '❌ Invalid day! Please enter a day between 1 and 31.', ephemeral: true });
        }

        if (month < 1 || month > 12) {
            return message.reply({ content: '❌ Invalid month! Please enter a month between 1 and 12.', ephemeral: true });
        }

        // Additional validation for days in specific months
        const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (day > daysInMonth[month - 1]) {
            return message.reply({ content: `❌ Invalid date! Month ${month} only has ${daysInMonth[month - 1]} days.`, ephemeral: true });
        }

        // Initialize birthdays object if it doesn't exist
        if (!settings[guildId].birthdays) {
            settings[guildId].birthdays = {};
        }

        // Check if user already has a birthday registered
        const existingBirthday = settings[guildId].birthdays[userId];
        if (existingBirthday) {
            const updateEmbed = new EmbedBuilder()
                .setTitle('🎂 Update Birthday?')
                .setDescription(`You already have a birthday registered: **${existingBirthday.day}/${existingBirthday.month}**\n\nDo you want to update it to **${day}/${month}**?`)
                .setColor('#FFA500')
                .setFooter({ 
                    text: 'Reply with "yes" to update or "no" to cancel', 
                    iconURL: message.client.user.displayAvatarURL({ dynamic: true }) 
                })
                .setTimestamp();

            const confirmMessage = await message.reply({ embeds: [updateEmbed] });

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
                    return confirmMessage.edit({ 
                        embeds: [new EmbedBuilder()
                            .setTitle('❌ Birthday Update Cancelled')
                            .setDescription('Your birthday was not updated.')
                            .setColor('#ff0000')
                        ] 
                    });
                }
            } catch (error) {
                return confirmMessage.edit({ 
                    embeds: [new EmbedBuilder()
                        .setTitle('⏰ Confirmation Timeout')
                        .setDescription('Birthday update cancelled due to timeout.')
                        .setColor('#ff0000')
                    ] 
                });
            }
        }

        // Save the birthday
        settings[guildId].birthdays[userId] = {
            day: day,
            month: month,
            username: message.author.username,
            displayName: message.member.displayName,
            addedAt: Date.now()
        };

        saveBirthdaySettings(settings);

        // Get month name
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // Success embed
        const successEmbed = new EmbedBuilder()
            .setTitle('🎉 Birthday Added Successfully!')
            .setDescription(`Your birthday has been registered!`)
            .addFields(
                { name: '📅 Birthday', value: `${day} ${monthNames[month - 1]}`, inline: true },
                { name: '👤 User', value: message.author.tag, inline: true },
                { name: '🎂 What happens next?', value: 'You\'ll receive birthday wishes on your special day!', inline: false }
            )
            .setColor('#00ff00')
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();

        message.reply({ embeds: [successEmbed], ephemeral: true });
    },
};