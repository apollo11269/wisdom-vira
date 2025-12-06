const { EmbedBuilder } = require('discord.js');
const { loadBirthdaySettings } = require('./setupbirthdays.js');

module.exports = {
    name: 'birthdays',
    aliases: ['bdays', 'birthdaylist'],
    description: 'View all registered birthdays in the server',
    async execute(message, args) {
        const guildId = message.guild.id;
        const settings = loadBirthdaySettings();

        // Check if birthday system is set up
        if (!settings[guildId]) {
            return message.reply({ content: '❌ Birthday system is not set up! Ask an administrator to use `!setupbirthdays` first.', ephemeral: true });
        }

        const birthdays = settings[guildId].birthdays || {};
        const birthdayEntries = Object.entries(birthdays);

        if (birthdayEntries.length === 0) {
            const noBirthdaysEmbed = new EmbedBuilder()
                .setTitle('🎂 No Birthdays Registered')
                .setDescription('No one has registered their birthday yet!\n\nUse `!addbirthday DD/MM` to add your birthday.')
                .setColor('#FFA500')
                .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
                .setTimestamp();

            return message.reply({ embeds: [noBirthdaysEmbed], ephemeral: true });
        }

        // Get month names
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // Sort birthdays by month and day
        const sortedBirthdays = birthdayEntries.sort((a, b) => {
            const [userIdA, birthdayA] = a;
            const [userIdB, birthdayB] = b;
            
            if (birthdayA.month !== birthdayB.month) {
                return birthdayA.month - birthdayB.month;
            }
            return birthdayA.day - birthdayB.day;
        });

        // Get current date for highlighting upcoming birthdays
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();

        // Group birthdays by month
        const birthdaysByMonth = {};
        sortedBirthdays.forEach(([userId, birthday]) => {
            const monthKey = birthday.month;
            if (!birthdaysByMonth[monthKey]) {
                birthdaysByMonth[monthKey] = [];
            }
            birthdaysByMonth[monthKey].push({ userId, ...birthday });
        });

        // Create embed
        const birthdaysEmbed = new EmbedBuilder()
            .setTitle('🎂 Server Birthdays')
            .setDescription(`Here are all the registered birthdays in **${message.guild.name}**!`)
            .setColor('#FF69B4')
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setFooter({ text: 'WisdomSystem V4.1 ⭕ | By Apollo 👀' })
            .setTimestamp();

        // Add fields for each month that has birthdays
        Object.keys(birthdaysByMonth).sort((a, b) => parseInt(a) - parseInt(b)).forEach(month => {
            const monthBirthdays = birthdaysByMonth[month];
            const monthName = monthNames[parseInt(month) - 1];
            
            let monthText = '';
            monthBirthdays.forEach(birthday => {
                const isToday = birthday.month === currentMonth && birthday.day === currentDay;
                const dayStr = birthday.day.toString().padStart(2, '0');
                
                if (isToday) {
                    monthText += `🎉 **${dayStr}** - ${birthday.displayName} **(TODAY!)**\n`;
                } else {
                    monthText += `📅 **${dayStr}** - ${birthday.displayName}\n`;
                }
            });
            
            birthdaysEmbed.addFields({
                name: `${getMonthEmoji(parseInt(month))} ${monthName}`,
                value: monthText || 'No birthdays',
                inline: true
            });
        });

        // Add upcoming birthdays section
        const upcomingBirthdays = getUpcomingBirthdays(sortedBirthdays, currentMonth, currentDay);
        if (upcomingBirthdays.length > 0) {
            let upcomingText = '';
            upcomingBirthdays.slice(0, 5).forEach(birthday => {
                const daysUntil = getDaysUntilBirthday(birthday.month, birthday.day, currentMonth, currentDay);
                upcomingText += `🎂 ${birthday.displayName} - ${birthday.day}/${birthday.month} (${daysUntil} days)\n`;
            });
            
            birthdaysEmbed.addFields({
                name: '🔜 Upcoming Birthdays',
                value: upcomingText,
                inline: false
            });
        }

        message.reply({ embeds: [birthdaysEmbed], ephemeral: true });
    },
};

// Helper function to get month emoji
function getMonthEmoji(month) {
    const emojis = ['❄️', '💝', '🌸', '🌷', '🌺', '☀️', '🌻', '🌊', '🍂', '🎃', '🦃', '🎄'];
    return emojis[month - 1] || '📅';
}

// Helper function to get upcoming birthdays
function getUpcomingBirthdays(birthdays, currentMonth, currentDay) {
    return birthdays
        .map(([userId, birthday]) => ({ userId, ...birthday }))
        .filter(birthday => {
            const daysUntil = getDaysUntilBirthday(birthday.month, birthday.day, currentMonth, currentDay);
            return daysUntil > 0 && daysUntil <= 30; // Next 30 days
        })
        .sort((a, b) => {
            const daysA = getDaysUntilBirthday(a.month, a.day, currentMonth, currentDay);
            const daysB = getDaysUntilBirthday(b.month, b.day, currentMonth, currentDay);
            return daysA - daysB;
        });
}

// Helper function to calculate days until birthday
function getDaysUntilBirthday(birthdayMonth, birthdayDay, currentMonth, currentDay) {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    let birthdayThisYear = new Date(currentYear, birthdayMonth - 1, birthdayDay);
    const today = new Date(currentYear, currentMonth - 1, currentDay);
    
    // If birthday has passed this year, calculate for next year
    if (birthdayThisYear < today) {
        birthdayThisYear = new Date(currentYear + 1, birthdayMonth - 1, birthdayDay);
    }
    
    const diffTime = birthdayThisYear - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}